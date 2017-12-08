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

async function printWalletInfosFromAddress(address) {
    try {
        var balance = await blockexplorer.getBalance(address);
        var account = balance[address];

        var btcRemaining = account.final_balance > 0 ? account.final_balance / 100000000 : 0;
        var btcReceived = account.total_received > 0 ? account.total_received / 100000000 : 0;

        console.log(`======= ${address} =======`);
        console.log(`balance: ${btcRemaining} BTC / ${btcReceived} BTC au total (${account.n_tx} transactions)`);
    } catch (ex) {
        console.error(ex);
    }
}


var wallet = getWalletFromPassphrase('test');
printWalletInfosFromAddress(wallet.address);