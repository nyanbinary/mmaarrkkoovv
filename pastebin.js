'use strict';

const { _debug, _info, _notice, _warning, _error, _critical } = require('./logging');
const moment = require('moment');
const https = require('https');
const querystring = require('querystring');


const baseurl = 'https://pastebin.com/api/api_post.php';

let api_dev_key = null;


const VISIBILITY = { PUBLIC: 0, UNLISTED: 1, PRIVATE: 2 };
const FORMAT = { TEXT: 'text', JSON: 'json', JAVASCRIPT: 'javascript' };
const EXPIRE = {
    NEVER: 'N',
    _10M: '10M',
    _1H: '1H',
    _1D: '1D',
    _1W: '1W',
    _2W: '2W',
    _1M: '1M',
    _6M: '6M',
    _1Y: '1Y',
};

module.exports = {
    create, connect,
    visibility: VISIBILITY, format: FORMAT, expire: EXPIRE,
};


function connect(token) {
    api_dev_key = token;
}


function create(content, params) {
    if (api_dev_key === null)
        throw new Error("no token given");

    params = Object.assign({
        api_dev_key,
        api_option: 'paste',
        api_paste_code: content,

        api_paste_name: 'my_paste',
        api_paste_format: FORMAT.TEXT,
        api_paste_private: VISIBILITY.UNLISTED,
        api_paste_expire_date: EXPIRE._10M,
    }, params);

    return new Promise((resolve, reject) => {
        const postData = querystring.stringify(params);

        let options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length,
            },
        };

        _debug(`[${moment().format()}] pastebin`);

        const req = https.request(baseurl, options, (res, err) => {
            if (err) return reject(_error(err));

            let data = '';
            res.on('data', (d) => { data += d; });

            res.on('end', () => {
                if (!data.startsWith("https"))
                    return reject(_error(data));

                resolve(data);
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
