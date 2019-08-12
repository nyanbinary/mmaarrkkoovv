'use strict';

const Struct = require('./Struct');
const User = require('./User');
const Enum = require('./Enum');


const ChatMember = module.exports = Struct('ChatMember', {
    user: [User, undefined],
    status: [Enum('creator', 'administrator', 'member', 'restricted', 'left', 'kicked'), undefined],
});


ChatMember.prototype.display = function() {
    return `${this.user.display()} is a(n) ${this.status} of this chat.`;
};
