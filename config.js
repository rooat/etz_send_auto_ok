var Web3 = require('web3');
//var net = require('net');
var web3 = new Web3("https://etzrpc.org");
var {Power} = require('./util/power');
web3.extend(Power)

var {Account,UserData,Contracts,Transaction,NetRpc,Logset} = require('./db');
var Common = require('./util/common')
module.exports ={
    web3,
    Transaction,
    Common,
    Account,
    UserData,
    Logset
}