'use strict';

const https = require('https');
const moment = require('moment');
const FormData = require('form-data');

const Update = require('./Types/Update');
const User = require('./Types/User');
const List = require('./Types/List');
const Message = require('./Types/Message');
const ChatMember = require('./Types/ChatMember');

let me = null;
let baseurl = null;

const { _debug, _info, _notice, _warning, _error, _critical } = require('./logging');


module.exports = {
    connect, call,
    polling, send, sendData,
    getChatMember,

    get me() {
        return me;
    },
};


function connect(token) {
    baseurl = 'https://api.telegram.org/bot' + token + '/';

    return call('getMe', {}, User).then((_me) => {
        me = _me;

        _notice('Connected as ' + me.display());
        return me;
    });
}

let apicalls = 0;

function call(name, params, struct, type = 'json') {
    const LOGDATA = params._LOGDATA !== false;
    delete params._LOGDATA;

    return new Promise((resolve, reject) => {
        let apicall = ++apicalls;

        if (baseurl === null)
            return reject(_critical("Not connected"));

        const url = baseurl + name;

        let options, postData;

        if (type === 'json') {
            postData = JSON.stringify(params);

            options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    // 'Content-Length': Buffer.from(postData).length,
                },
            };
        }
        else if (type === 'file') {
            // Convert to formdata
            let form = new FormData();
            for (let key in params) {
                let val = params[key];
                if (!val) continue;

                let options = {};
                let data;

                // ['FILE', filename, data]
                if (Array.isArray(val) && val[0] === 'FILE') {
                    options.filename = val[1];
                    data = val[2];
                } else {
                    data = val;
                }

                form.append(key, data, options);
            }

            options = {
                method: 'POST',
                headers: form.getHeaders(),
            };

            postData = form.getBuffer();
        }
        else
            throw new Error("wrong type for call");

        let starttime = moment();

        if (_debug.ok) {
            let log = '';
            log += `[${starttime.format()}]`;
            log += ` #${apicall}`;
            log += ` /${name}`;
            if (LOGDATA) log += ` | ${postData}`;
            if (struct && struct.name) log += ' -> ' + struct.name;
            _debug(log);
        }

        const req = https.request(url, options, (res, err) => {
            if (err) return reject(_error(err));

            let data = '';

            res.on('data', (d) => { data += d; });

            res.on('end', () => {
                if (_debug.ok) {
                    let log = '';
                    log += `[+${moment().diff(starttime)} ms]`;
                    log += ` #${apicall}`;
                    if (LOGDATA) log += ' | ' + data;
                    _debug(log);
                }

                data = JSON.parse(data);

                if (!data.ok)
                    return reject(_error(new Error(JSON.stringify(data))));

                let result = data.result;

                if (typeof struct !== 'undefined') {
                    result = struct.from(result);
                }

                resolve(result);
            });
        });

        req.on('error', (err) => {
            if (err)
                return reject(_error(err));
        });

        req.write(postData);
        req.end();
    });
};


function polling(callback, options = {}) {
    // Apply defaults
    options = Object.assign({
        timeout: 60,
        offset: 0,
    }, options);

    call('getUpdates', options, List(Update))
        .then((updates) => {
            let offset = options.offset;

            for (let update of updates) {
                offset = Math.max(offset, update.update_id + 1);
                callback(update);
            }

            options.offset = offset;
        })
        .catch((err) => {
            _error(err);
        })
        .finally(() => {
            polling(callback, options);
        });
};

function send(chat_id, text, options = {}) {
    if (typeof options === 'string') {
        options = { parse_mode: options };
    }

    // Apply defaults
    options = Object.assign({
        chat_id,
        text,
        parse_mode: 'html',
        //disable_web_page_preview: true,
        //disable_notification: false,
        //reply_to_message_id: 0,
    }, options);

    if (options.parse_mode === 'plain') {
        delete options.parse_mode;
    }

    return call('sendMessage', options, Message)
        .then((message) => {
            _debug(message.display());
            return message;
        })
        .catch((err) => {
            _error(err);
        });
}

function sendData(chat_id, data, name = 'bin', options) {
    options = Object.assign({
        _LOGDATA: false,

        chat_id,
        document: ['FILE', name, data],
        parse_mode: undefined,
        disable_notification: false,
        reply_to_message_id: undefined,
    }, options);

    return call('sendDocument', options, Message, 'file');
}


function getChatMember(chat_id, user_id) {
    return call('getChatMember', { chat_id, user_id }, ChatMember).then((cm) => {
        _debug(cm.display());
        return cm;
    });
}
