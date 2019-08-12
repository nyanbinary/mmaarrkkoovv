'use strict';

const Struct = require('./Struct');
const Integer = require('./Integer');
const Message = require('./Message');

const Update = module.exports = Struct('Update', {
    update_id: [Integer, undefined],
    message: [Message, null],
    edited_message: [Message, null],
});

Update.prototype.display = function() {
    let str = '';

    str += 'Update #' + this.update_id + ' ';

    const message = this.edited_message || this.message;
    if (message === null) return str + '! Unsupported !';

    str += this.edited_message ? '🌀' : '✍️';

    str += '\n';
    str += message.display();

    return str;
};
