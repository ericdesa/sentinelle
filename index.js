var bigi = require('bigi');
var bitcoin = require('bitcoinjs-lib');
var blockexplorer = require('blockchain.info/blockexplorer');
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

explore(require('./passphrase/list2'), 500);
