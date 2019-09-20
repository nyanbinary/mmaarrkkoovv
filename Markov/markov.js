'use strict';

const fs = require('fs');
const path = require('path');

const Chain = require('./Chain');

const { _debug, _info, _notice, _warning, _error, _critical } = require('../logging');



const Markov = module.exports = {};

Markov.__chains = {};
Markov.__links = {};

/**
 * @return Chain|null|false  null if not found and !create,  false if disabled
 */
Markov.chain = function(chainid, create = true, followlink = true) {
    if (followlink && typeof Markov.__links[chainid] !== 'undefined') {
        chainid = Markov.__links[chainid];
    }

    if (typeof Markov.__chains[chainid] !== 'undefined') {
        return Markov.__chains[chainid];
    }

    if (create) {
        const chain = Markov.__chains[chainid] = new Chain();
        chain.id = chainid;
    } else {
        return null;
    }
};

Markov.__chainfile = function(chainid) {
    return path.join(__dirname, 'stores', 'chain@' + chainid + '.json')
};

Markov.save = function(chainid) {
    const chain = Markov.chain(chainid, false, true);
    if (chain === null || chain === false) return false;

    const filename = Markov.__chainfile(chain.id);

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
        if (Markov.__chains[chainid]) {
            ok &= Markov.save(chainid);
        }
    }

    return ok;
};

Markov.drop = function(chainid) {
    Markov.deactivate(chainid);

    // Instead of disabling it, we act as if we don't know it,
    // so it'll get overwritten later
    delete Markov.__chains[chainid];
    delete Markov.__links[chainid];
};

Markov.load = function(chainid, overwrite = false) {
    const chain = Markov.chain(chainid, false);
    if (chain === false) return;

    if (chain !== null) {
        if (overwrite) {
            _warning("Overwriting existing chain for chat " + chainid);
        } else {
            _info("Refused overwriting chain " + chainid);
            return false;
        }
    }

    const filename = path.join(__dirname, 'stores', 'chain@' + chainid + '.json');

    try {
        const json = JSON.parse(fs.readFileSync(filename));

        if (typeof json === 'number') {
            // This was linked to another chain, so link it
            Markov.__links[chainid] = json;

            _notice(`Loaded chain ${chainid} as link to ${json}`);
        } else {
            const c = Markov.__chains[chainid] = new Chain(json);
            c.id = chainid;
            _notice(`Loaded chain ${chainid} with ${c.json().a} entries`);
        }

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

Markov.deactivate = function(chainid) {
    Markov.save(chainid);
    // Disable chain
    Markov.__chains[chainid] = false;

    const chainfile = Markov.__chainfile(chainid);

    let bakfile = chainfile + '.0.bak';
    for (let i = 1; fs.existsSync(bakfile); i++) {
        bakfile = chainfile + '.' + i + '.bak';
    }

    _notice("Moving " + chainfile + " to " + bakfile);

    try {
        fs.renameSync(chainfile, bakfile);
        return true;
    } catch (e) {
        _error(e);
        return false;
    }
};

Markov.link = function(fromchainid, tochainid) {
    if (fromchainid === tochainid) {
        throw new Error("Can't recurse links");
    }

    if (typeof Markov.__links[fromchainid] !== 'undefined') {
        throw new Error("Can only link chain to one other chat");
    }

    if (Markov.__chains[fromchainid] !== false) {
        throw new Error("Can only link chain if it's deactivated");
    }

    if (typeof Markov.__links[tochainid] !== 'undefined') {
        throw new Error("Can't link to a link");
    }

    _notice("Linking " + fromchainid + " to " + tochainid);
    Markov.__links[fromchainid] = tochainid;

    fs.writeFileSync(Markov.__chainfile(fromchainid), tochainid);
};

Markov.unlink = function(chainid) {
    if (typeof Markov.__links[chainid] === 'undefined') {
        return false;
    } else {
        delete Markov.__links[chainid];

        // Re-enable chain if it's disabled
        if (Markov.__chains[chainid] === false)
            delete Markov.__chains[chainid];

        _notice("No longer linking " + chainid);
        return true;
    }
};
