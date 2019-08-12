'use strict';

const Boolean = module.exports = function Boolean() { };

Boolean.from = function(json) {
    if (typeof json !== 'boolean')
        throw new TypeError("Invalid json - not a boolean: " + json);

    return json;
};
