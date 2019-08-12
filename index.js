const network = require('./network');
const { _debug, _info, _notice, _warning, _error, _critical } = require('./logging');

const markov = require('./Markov/markov.js');


function isAdmin(chat_id, user_id) {
    return network.getChatMember(chat_id, user_id).then((cm) => {
        return cm.status === 'creator' || cm.status === 'administrator';
    });
}


async function handleCommand(message) {
    const chatid = message.chat.id;

    const admin = async () => message.chat.type === 'private' || await isAdmin(chatid, message.from.id);

    let _cmd = message.getCommand(network.me.username);
    if (_cmd === null) return false;

    const [cmd, args, directed] = _cmd;

    _info(`Command ${JSON.stringify(_cmd)} issued by ${message.from.display()}`);

    if (cmd === '/generate') {
        network.send(chatid, markov.chain(chatid).generate());
    }
    else if (cmd === '/save') {
        const ok = markov.save(chatid);
        network.send(chatid, (ok ? 'Saved' : 'Failed to save') + ' current chain');
    }
    else if (cmd === '/saveall') {
        const ok = markov.saveall();
        network.send(chatid, (ok ? 'Saved' : 'Failed to save') + ' all chains');
    }
    else if (cmd === '/debug') {
        network.send(chatid, '<pre>' + JSON.stringify(markov.chain(chatid).json(), null, '\t') + '</pre>');
    }
    else if (cmd === '/drop') {
        if (await admin()) {
            markov.drop(chatid);
            network.send(chatid, 'Dropped current chain');
        } else {
            network.send(chatid, 'Not enough permissions');
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
    else if (directed) {
        network.send(chatid, 'Unknown command');
    }
}


async function main() {
    const token = require('fs').readFileSync('./TOKEN').toString().trim();
    await network.connect(token);

    markov.loadall();

    network.polling((update) => {
        _notice(update.display());

        if (update.message) {
            handleCommand(update.message);

            const text = update.message.getText();
            if (text) {
                const chatid = update.message.chat.id;
                markov.chain(chatid).process(text);
            }
        }
    });
}

main();
