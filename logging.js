const logginglevel = (() => {
    try {
        return +require('fs').readFileSync('./logginglevel').toString().split('\n')[0];
    } catch {
        return 0;
    }
})();


function log(level) {
    let ok = logginglevel <= level;

    let func = ok ? console.log.bind(console) : function(err) {
        if (level >= /*CRITICAL*/5) {
            // If not logging criticals, throw
            throw err;
        }
    };

    // Check if it would be logged or not before actually logging
    func.ok = ok;

    return func;
}


const
    _debug = log(0),
    _info = log(1),
    _notice = log(2),
    _warning = log(3),
    _error = log(4),
    _critical = log(5);


module.exports = {
    _debug, _info, _notice, _warning, _error, _critical
};
