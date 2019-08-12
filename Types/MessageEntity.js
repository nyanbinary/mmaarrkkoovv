'use strict';

const Struct = require('./Struct');
const Integer = require('./Integer');
const User = require('./User');
const String = require('./String');
const Enum = require('./Enum');

const MessageEntity = module.exports = Struct('MessageEntity', {
    type: [Enum(['mention', 'hashtag', 'cashtag', 'bot_command', 'url', 'email', 'phone_number', 'bold', 'italic', 'code', 'pre', 'text_link', 'text_mention']), undefined],
    offset: [Integer, undefined],
    length: [Integer, undefined],
    url: [String, ''],
    user: [User, null],
});
