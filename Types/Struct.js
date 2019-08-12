'use strict';

// Not a class, just a helper
const Struct = module.exports = function(name, fields) {
    // Just a sanity check before the `eval`
    if (/[^\w]/i.test(name) || name.length === 0)
        throw new Error("Invalid name - must be alphanum and >= 1 letter");

    // Create function with the given name
    let struct = eval(`(_=>function ${name}(){})()`);

    struct.__fields = fields;

    struct.from = (json) => Struct.from(json, struct);

    return struct;
};


Struct.from = function(json, struct) {
    if (json === null) return null;

    const fields = struct.__fields;

    let instance = new struct;

    for (let field in fields) {
        const definition = fields[field];
        let value = json[field];
        delete json[field];

        // Explicitly ignore field
        if (definition === void 0) {
            continue;
        }

        // Every definition is of the type [Struct, Default]
        const fieldstruct = definition[0];
        const defaultval = definition[1];

        // No value set? Try default
        if (typeof value === 'undefined') {
            value = defaultval;

            // No default? Error
            if (typeof value === 'undefined')
                throw new TypeError("Invalid json - missing field " + field);
        }

        instance[field] = fieldstruct.from(value);
    }

    if (Object.keys(json).length > 0) {
        instance.__unused = json;
    }

    return instance;
};
