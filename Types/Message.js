'use strict';

const moment = require('moment');

const Struct = require('./Struct');
const Integer = require('./Integer');
const User = require('./User');
const Chat = require('./Chat');
const String = require('./String');
const MessageEntity = require('./MessageEntity');
const List = require('./List');

const msgtypes = [
    'audio', 'document', 'animation', 'game', 'photo',
    'sticker', 'video', 'voice', 'video_note', 'contact',
    'location', 'venue', 'poll',
    'new_chat_members', 'left_chat_members',
    'new_chat_title', 'new_chat_photo', 'delete_chat_photo',
    'group_chat_created', 'supergroup_chat_created',
    'channel_chat_created', 'migrate_to_chat_id', 'migrate_from_chat_id',
    'pinned_message', 'invoice', 'successful_payment',
    'connected_website', 'passport_data', 'reply_markup'
];


const Message = module.exports = Struct('Message', {
    message_id: [Integer, undefined],
    from: [User, null],
    date: [Integer, undefined],
    edit_date: [Integer, 0],
    chat: [Chat, undefined],
    text: [String, ''],
    entities: [List(MessageEntity), []],
    caption: [String, ''],

    __type: [String, undefined],
});

const oldfrom = Message.from;
Message.from = function(json) {
    if (json === null) return oldfrom(null);

    let msgtype = 'text';

    for (let type of msgtypes) {
        if (typeof json[type] !== 'undefined') {
            msgtype = type;
            break;
        }
    }

    json.__type = msgtype;
    return oldfrom(json);
};

Message.prototype.getText = function() {
    return this.text || this.caption || undefined;
};

Message.prototype.getCommand = function(username) {
    if (this.text && this.text.startsWith('/')) {
        let args = this.text.split(/\s/);
        let cmd = args.shift();

        if (cmd.includes('@')) {
            let parts = cmd.split('@');
            if (parts.length === 2 && parts[1] === username) {
                return { cmd: parts[0], args, directed: true };
            }
        } else {
            return { cmd, args, directed: false };
        }
    }

    return null;
};


Message.prototype.display = function() {
    let str = '';

    str += 'Message #' + this.message_id + '\n';

    let date = this.edit_date || this.date;
    str += 'Date: ' + moment(date * 1000).format() + '\n';
    if (this.from) str += 'From: ' + this.from.display() + '\n';
    if (this.chat) str += 'Chat: ' + this.chat.display() + '\n';
    if (this.text) str += 'Text: ' + JSON.stringify(this.text) + '\n';
    else str += 'Type: ' + this.__type + '\n';

    return str;
};
