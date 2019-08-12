'use strict';

// Not a class, just a helper
const Enum = module.exports = function Enum(options) {
    if (!Array.isArray(options)) options = Array.from(arguments);

    return {
        from: (json) => Enum.from(json, options),
    };
};

Enum.from = function(json, options) {
    if (typeof json !== 'string')
        throw new TypeError("Invalid json - not a string: " + json);

    if (!options.includes(json))
        throw new TypeError("Invalid json - invalid option: " + json);

    return json;
};
