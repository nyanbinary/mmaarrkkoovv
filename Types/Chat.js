'use strict';

const Struct = require('./Struct');
const Integer = require('./Integer');
const Enum = require('./Enum');


const Chat = module.exports = Struct('Chat', {
    id: [Integer, undefined],
    type: [Enum('private', 'group', 'supergroup', 'channel'), undefined],

    // Ignore these fields
    first_name: void 0,
    last_name: void 0,
    username: void 0,
});


Chat.prototype.display = function() {
    return this.type + ' chat #' + this.id;
};
