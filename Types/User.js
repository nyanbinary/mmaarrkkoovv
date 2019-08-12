'use strict';

const Struct = require('./Struct');
const Integer = require('./Integer');
const Boolean = require('./Boolean');
const String = require('./String');


const User = module.exports = Struct('User', {
    id: [Integer, undefined],
    is_bot: [Boolean, undefined],
    first_name: [String, undefined],
    last_name: [String, ''],
    username: [String, ''],
    language_code: [String, ''],
});


User.prototype.display = function() {
    let str = '';

    str += this.is_bot ? '🤖' : '👤';

    str += ' #' + this.id;

    if (this.username) str += ' @' + this.username;

    if (this.language_code) str += ' ' + this.language_code;

    str += ' ' + JSON.stringify([this.first_name, this.last_name]);

    return str;
};
