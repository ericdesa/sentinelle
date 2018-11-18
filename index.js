var bigi = require('bigi');
var bitcoin = require('bitcoinjs-lib');
var blockexplorer = require('blockchain.info/blockexplorer');
var fs = require('fs');
var wif = require('wif');

function getWalletFromPassphrase(passphrase) {
    var hash = bitcoin.crypto.sha256(passphrase);
    var d = bigi.fromBuffer(hash);
    var address = new bitcoin.ECPair(d).getAddress();
    var privateKey = wif.encode(128, hash, true);

    return {
        'address': address,
        'privateKey': privateKey
    };
}

async function getWalletInfosFromAddress(address) {
    var balance = await blockexplorer.getBalance(address);
    var account = balance[address];

    var btcRemaining = account.final_balance > 0 ? account.final_balance / 100000000 : 0;
    var btcReceived = account.total_received > 0 ? account.total_received / 100000000 : 0;

    return {
        'address': address,
        'btcRemaining': btcRemaining,
        'btcReceived': btcReceived,
        'nbTransactions': account.n_tx
    };
}

function printWalletInfos(walletInfos, printOnlyWhenPositiveBalance, passphrase) {
    if ((printOnlyWhenPositiveBalance && walletInfos.btcReceived) || !printOnlyWhenPositiveBalance) {
        console.log(`passphrase: ${passphrase} || balance: ${walletInfos.btcRemaining} BTC / ${walletInfos.btcReceived} BTC au total (${walletInfos.nbTransactions} transactions)`);
    }
}

async function explore(passphraseList, delay) {
    if (passphraseList.length > 0) {
        var passphrase = passphraseList[0];
        var wallet = getWalletFromPassphrase(passphrase);
        var walletInfos = await getWalletInfosFromAddress(wallet.address);

        printWalletInfos(walletInfos, false, passphrase);
        setTimeout(() => {
            explore(passphraseList.slice(1), delay);
        }, delay);
    }
}


async function testRandomFromList(listFilepath, pathLength = 6, concatenation = ' ') {
    var sourceArray = require(listFilepath);
    var testedArray = require('./output/tested.js');
    var hasAlreadyBeenTested = true;

    // passphrase
    do {
        var suggest = [];
        for (var i = 0; i < pathLength; i++) {
            suggest.push(sourceArray[Math.floor(Math.random() * sourceArray.length)]);
        }

        var passphrase = suggest.join(concatenation);
        hasAlreadyBeenTested = testedArray.indexOf(passphrase) !== -1;
    } while (hasAlreadyBeenTested)

    // infos
    var wallet = getWalletFromPassphrase(passphrase);
    var walletInfos = await getWalletInfosFromAddress(wallet.address);

    // persistance
    addPassphraseToFile(passphrase, './output/tested');
    if (walletInfos.nbTransactions > 0) {
        printWalletInfos(walletInfos, true, passphrase);
        addPassphraseToFile(passphrase, './output/match');
    }

    // loop
    setTimeout(() => {
        testRandomFromList(listFilepath, pathLength, concatenation);
    }, 500);
}

function addPassphraseToFile(passphrase, filepath) {
    var testedArray = require(filepath);
    testedArray.push(passphrase);

    var writeStream = fs.createWriteStream(filepath + '.js');
    writeStream.write(`module.exports = [\n`);
    testedArray.forEach((passphrase) => writeStream.write(`"${passphrase}",\n`));
    writeStream.write(`]`);
    writeStream.end();
}


testRandomFromList('./passphrase/list1');
// explore(require('./passphrase/list5'), 500);