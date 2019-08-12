function step(root, next, last = false) {
    if (typeof root === 'undefined' || typeof next === 'undefined') return undefined;

    let obj;

    if (typeof root.c[next] !== 'undefined') {
        obj = root.c[next];
        obj.a++;
    } else {

        if (last) {
            obj = root.c[next] = {
                a: 1,
            };
        } else {
            obj = root.c[next] = {
                a: 1, c: {},
            };
        }
    }

    return obj;
}

function path(root, first, second, third) {
    root.a++;
    step(step(step(root, first), second), third, true);
}


const Chain = module.exports = function Chain(json = null) {
    if (json === null) {
        json = { a: 0, c: {} };
    }

    this.chain = json;
};


Chain.prototype.json = function() {
    return this.chain;
};

Chain.prototype.process = function(text) {
    let words = text.toLowerCase().split(/\s/g);

    for (let i = 0; i < words.length - 1; i++) {
        path(this.chain, words[i], words[i + 1], words[i + 2]);
    }
};

function randomchild(root) {
    let rand = Math.floor(Math.random() * root.a); // 0 (inc) ~ root.a (exc)

    for (let nextk of Object.keys(root.c)) {
        let nextv = root.c[nextk];

        rand -= nextv.a;
        if (rand < 0) {
            return [nextk, nextv];
        }
    }

    return null;
}

Chain.prototype.generate = function() {
    let word = '';
    let tries = 0;
    do {
        try {
            word = this._generate();
        } catch (e) {
            _error(e);
            word = false;
        }
    } while ((!word || word.length < 2) && ++tries < 10);

    return word;
};

Chain.prototype._generate = function() {
    const root = this.chain;
    if (root.a === 0) return;

    /**
     FIRST = root[random]
     SECOND = FIRST[random]

     THIRD = SECOND[random]
     FIRST = root[SECOND]
     SECOND = FIRST[THIRD]

     THIRD = SECOND[random]
     FIRST = root[SECOND]
     SECOND = FIRST[THIRD]

     ...
     */

    let generated = '';

    let [ak, av] = randomchild(root);
    generated += ak;

    let [bk, bv] = randomchild(av);
    generated += ' ' + bk;

    let steps = 0;
    while (generated.length < 200 && ++steps < 100) {
        let _tmp = randomchild(bv);
        if (_tmp === null) break;

        let [ck] = _tmp;
        [ak, av] = [bk, root.c[bk].c];
        [bk, bv] = [ck, av[ck]];

        generated += ' ' + ck;
    }

    return generated;
};
