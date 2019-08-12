'use strict';

const fs = require('fs');
const path = require('path');

const Chain = require('./Chain');

const { _debug, _info, _notice, _warning, _error, _critical } = require('../logging');



const Markov = module.exports = {};

Markov.__chains = {};

Markov.chain = function(chainid, create = true) {
    if (typeof Markov.__chains[chainid] !== 'undefined') {
        return Markov.__chains[chainid];
    }

    if (create) {
        return Markov.__chains[chainid] = new Chain();
    } else {
        return null;
    }
};

Markov.save = function(chainid) {
    const chain = Markov.chain(chainid, false);
    const filename = path.join(__dirname, 'stores', 'chain@' + chainid + '.json');

    try {
        fs.writeFileSync(filename, JSON.stringify(chain.json()));
        return true;
    } catch (e) {
        _error(e);
        return false;
    }
};

Markov.saveall = function() {
    let ok = true;

    for (let chainid in Markov.__chains) {
        ok &= Markov.save(chainid);
    }

    return ok;
};

Markov.drop = function(chainid) {
    delete this.__chains[chainid];
}

Markov.load = function(chainid, overwrite = false) {
    const chain = Markov.chain(chainid, false);
    if (chain !== null) {
        if (overwrite) {
            _warning("Overwriting existing chain for chat " + chainid);
        } else {
            _info("Refused overwriting chain " + chainid);
            return;
        }
    }

    const filename = path.join(__dirname, 'stores', 'chain@' + chainid + '.json');

    try {
        const c = this.__chains[chainid] = new Chain(JSON.parse(fs.readFileSync(filename)));

        _notice(`Loaded chain ${chainid} with ${c.json().a} entries`);

        return true;
    } catch (e) {
        _error(e);
        return false;
    }
};

Markov.loadall = function(overwrite = false) {
    const dir = path.join(__dirname, 'stores');
    for (let file of fs.readdirSync(dir)) {
        if (file.startsWith('chain@') && file.endsWith('.json')) {
            let chainid = file.split('@')[1].split('.json')[0];
            Markov.load(chainid, overwrite);
        }
    }
};
