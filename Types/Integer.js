'use strict';

const Integer = module.exports = function Integer() { };

Integer.from = function(json) {
    if (!Number.isInteger(json))
        throw new TypeError("Invalid json - not an integer: " + json);

    return json;
};
