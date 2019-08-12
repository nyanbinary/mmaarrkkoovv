'use strict';

const String = module.exports = function String() { };

String.from = function(json) {
    if (typeof json !== 'string')
        throw new TypeError("Invalid json - not a string: " + json);

    return json;
};
