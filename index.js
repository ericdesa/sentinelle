
var bitcoin = require('bitcoinjs-lib');
var bigi = require('bigi');
var wif = require('wif');
var blockexplorer = require('blockchain.info/blockexplorer');


function getWalletFromPassphrase(passphrase) {
    var hash = bitcoin.crypto.sha256(passphrase);
    var d = bigi.fromBuffer(hash);
    var address = new bitcoin.ECPair(d).getAddress();
    var privateKey = wif.encode(128, hash, true);
    return { 'address': address, 'privateKey': privateKey };
}

async function printWalletInfosFromAddress(address, printOnlyWhenPositiveBalance, passphrase) {
    try {
        var balance = await blockexplorer.getBalance(address);
        var account = balance[address];

        var btcRemaining = account.final_balance > 0 ? account.final_balance / 100000000 : 0;
        var btcReceived = account.total_received > 0 ? account.total_received / 100000000 : 0;

        if ((printOnlyWhenPositiveBalance && btcReceived) || !printOnlyWhenPositiveBalance) {
            console.log(`======= ${address} =======`);
            if (passphrase) console.log(`------- ${passphrase} -------`);
            console.log(`balance: ${btcRemaining} BTC / ${btcReceived} BTC au total (${account.n_tx} transactions)`);
        }
    } catch (ex) {
        console.error(ex);
    }
}

function explore(passphraseList, delay) {
    if (passphraseList.length > 0) {
        var passphrase = passphraseList[0];
        var wallet = getWalletFromPassphrase(passphrase);

        printWalletInfosFromAddress(wallet.address, false, passphrase);
        setTimeout(() => {
            explore(words.slice(1));
        }, delay);
    }
}

explore(require('./passphrase/list1'), 500);
