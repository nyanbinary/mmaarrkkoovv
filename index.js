const network = require('./network');
//const pastebin = require('./pastebin');

const { _debug, _info, _notice, _warning, _error, _critical } = require('./logging');

const markov = require('./Markov/markov.js');

const ADMINS = require('./ADMINS');


function isAdmin(chat_id, user_id) {
    if (ADMINS.includes(user_id)) {
        return Promise.resolve(true);
    }

    return network.getChatMember(chat_id, user_id).then((cm) => {
        return cm.status === 'creator' || cm.status === 'administrator';
    });
}

let dropTokens = {};

function randstr(len) {
    let str = '';

    do {
        str += Math.random().toString(36).substring(2);
    } while (str.length < len);

    return str.substring(0, len);
}


// These are only used a few seconds, so they don't have to be stored
// anywhere else than memory, unless we really want to support
// keeping state across restarts
let LINKERS = {};

function newlinker() {
    const linker = {
        first: null,
        second: null,
        token: (() => {
            // Get a token that isn't yet in LINKERS
            let token;
            while (LINKERS[token = randstr(5)]) {}
            return token;
        })(),
    };

    return LINKERS[linker.token] = linker;
}

function getlinker(token) {
    return LINKERS[token] || null;
}

function droplinker(token) {
    delete LINKERS[token];
}


async function handleCommand(message) {
    // Make sure it's a command
    let _cmd = message.getCommand(network.me.username);
    if (_cmd === null) return false;


    const chatid = message.chat.id;
    const userid = message.from.id;

    const admin = async () =>
        message.chat.type === 'private' ||
        await isAdmin(chatid, userid);

    _info(`Command ${JSON.stringify(_cmd)} issued by ${message.from.display()}`);

    const { cmd, args, directed } = _cmd;

    if (cmd === '/generate') {
        const chain = markov.chain(chatid);
        if (!chain) {
            network.send(chatid, "No chain available for this chat");
        } else {
            let msg = chain.generate(args);
            if (msg === null) {
                if (args.length > 0) {
                    network.send(chatid, "Invalid start point");
                } else {
                    network.send(chatid, "Empty chain");
                }
            } else {
                network.send(chatid, msg, 'plain');
            }
        }
    }
    else if (cmd === '/save') {
        const ok = markov.save(chatid);
        network.send(chatid, (ok ? 'Saved' : 'Failed to save') + ' current chain');
    }
    else if (cmd === '/saveall') {
        const ok = markov.saveall();
        network.send(chatid, (ok ? 'Saved' : 'Failed to save') + ' all chains');
    }
    /*else if (cmd === '/debug_pastebin') {
        const data = JSON.stringify(markov.chain(chatid).json(), null, '\t');
        const url = await pastebin.create(data, {
            api_paste_name: 'chain.json',
            api_paste_format: pastebin.format.JSON,
        });
        network.send(chatid, "<b><a href='" + url + "'>chain.json</a></b>");
    }*/
    else if (cmd === '/debug') {
        const chain = markov.chain(chatid);
        if (chain) {
            const data = JSON.stringify(chain.json(), null, '\t');
            network.sendData(chatid, data, 'chain@' + chain.id + '.json');
        } else {
            network.send(chatid, "No chain is available for this chat yet.");
        }
    }
    else if (cmd === '/chatid') {
        network.send(chatid, "The current chat ID is " + chatid);
    }
    else if (cmd === '/drop') {
        if (await admin()) {
            let dropToken = dropTokens[chatid] = randstr(6);
            network.send(chatid, `Click /drop_${dropToken} if you're absolutely sure`);
        } else {
            network.send(chatid, 'Not enough permissions');
        }
    }
    else if (cmd.startsWith('/drop_')) {
        if (await admin()) {
            let dropToken = cmd.split('_', 2)[1];
            if (dropToken === dropTokens[chatid]) {
                markov.drop(chatid);
                delete dropTokens[chatid];
                network.send(chatid, 'Bye chain');
            } else {
                network.send(chatid, 'Invalid drop token');
            }
        } else {
            network.send(chatid, 'Thought you were clever huh');
        }
    }
    else if (cmd === '/load') {
        let overwrite = (args.length >= 1 && args[0] === 'overwrite') && await admin();
        markov.load(chatid, overwrite);
        network.send(chatid, 'Loaded current chain');
    }
    else if (cmd === '/loadall') {
        let overwrite = (args.length >= 1 && args[0] === 'overwrite') && await admin();
        markov.loadall(overwrite);
        network.send(chatid, 'Loaded all chains');
    }
    else if (cmd === '/echo') {
        network.send(chatid, args.join(' '));
    }
    else if (cmd === '/ping') {
        network.send(chatid, "Pong!");
    }

    else if (cmd === '/link') {
        if (await admin()) {
            let linker = newlinker();
            linker.first = chatid;

            network.send(chatid, `/link_${linker.token}\n\nForward this message to another chat to link the chains\n` +
                `Otherwise click /link_${linker.token}_cancel to cancel\n`);
        } else {
            network.send(chatid, "Sorry, you have to be an admin to link chains");
        }
    }
    else if (cmd.startsWith('/link_')) {

        await (async () => {
            try {
                let linkToken = cmd.split('_')[1] || '';
                let subCommand = cmd.split('_')[2] || '';

                if (!await admin()) {
                    network.send(chatid, "Sorry, you have to be an admin to link chains");
                    return;
                }

                let linker = getlinker(linkToken);
                if (linker === null) {
                    _error("Couldn't get linker " + linkToken + " as requested by " + userid);
                    network.send(chatid, "That token is unknown");
                    return;
                }

                if (subCommand === '') { // Just link
                    if (!await isAdmin(linker.first, userid)) {
                        network.send(chatid, "You have to be admin in the other chat to be able to link to it.");
                        return;
                    }

                    if (linker.first === chatid) {
                        network.send(chatid, "It wouldn't make sense to link a chain with itself");
                        return;
                    }

                    if (linker.second === null) {
                        linker.second = chatid;

                        network.send(chatid, "Because of laziness, we can't merge the chains yet. Which chain do you want to deactivate?\n" +
                            `Please press either /link_${linker.token}_other or /link_${linker.token}_this to choose\n` +
                            "No data will be lost, it will just be unavailable until you unlink the chat again.");
                    } else {
                        network.send(chatid, "Someone is already busy with that linker");
                    }
                }

                else if (subCommand === 'cancel') {
                    droplinker(linkToken);
                    network.send(chatid, "Link cancelled");
                }

                else if (subCommand === 'other' && linker.second !== null) {
                    markov.deactivate(linker.first);
                    markov.link(linker.first, linker.second);
                    network.send(chatid, "Chains are now linked!");
                    droplinker(linkToken);
                }

                else if (subCommand === 'this' && linker.second !== null) {
                    markov.deactivate(linker.second);
                    markov.link(linker.second, linker.first);
                    network.send(chatid, "Chains are now linked!");
                    droplinker(linkToken);
                }

                else {
                    network.send(chatid, "Sorry, I didn't quite catch that");
                }
            } catch (e) {
                _error(e);
                network.send(chatid, e.message);
            }
        })();
    }

    else if (cmd === '/unlink') {
        if (markov.unlink(chatid)) {
            network.send(chatid, "Messages are no longer linked to another chain");
        } else {
            network.send(chatid, "This chain wasn't linked anywhere");
        }
    }

    else if (directed) {
        network.send(chatid, 'Unknown command');
    }
}


async function main() {
    const token = require('fs').readFileSync('./TOKEN').toString().trim();
    await network.connect(token);

    // const pbtoken = require('fs').readFileSync('./TOKEN_PASTEBIN').toString().trim();
    // pastebin.connect(pbtoken);

    markov.loadall();

    network.polling((update) => {
        _notice(update.display());

        if (update.message) {
            handleCommand(update.message);

            const text = update.message.getText();
            if (text && !text.startsWith('/')) {
                const chatid = update.message.chat.id;
                const chain = markov.chain(chatid);

                if (chain) {
                    chain.process(text);
                } else {
                    _error("Couldn't process message because chain " + chatid + " is unavailable!");
                }
            }
        }
    });
}

main();
