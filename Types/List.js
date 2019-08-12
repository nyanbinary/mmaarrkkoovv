'use strict';

// Not a class, just a helper
const List = module.exports = function List(type) {
    return {
        from: (json) => List.from(json, type),
    };
};

List.from = function(json, type) {
    if (!Array.isArray(json))
        throw new TypeError("Invalid json - not an array: " + json);

    return json.map(type.from);
};
