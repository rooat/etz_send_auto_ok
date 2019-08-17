
var Web3 = require('web3');
var {Account,Contracts,Transaction,NetRpc} = require('../db');
var {Power} = require('../util/power');

class EtzClass{
  constructor() {
    this.txArr = []
    this.nonce=0;
    this.status = false;
    this.sendTask;
    this.isCollecting = false;
    this.web3 = new Web3("http://etzrpc.org");
    this.rpc_version = 0;
    this.accountMap = new Map();
  }
  async init(){
     this.web3.extend(Power);
     let accounts = await Account.find();
     if(accounts && accounts.length>0){
       for(var ik=0;ik<accounts.length;ik++){
         this.accountMap.set(accounts[ik].address,accounts[ik].private_key)
       }
     }
  }
  async start() {
    await this.init();
    setInterval(async function(){
      if(this.txArr.length==0){
        this.txArr = await Transaction.find({net_kind:"etz",state:0}).sort({'priority':1}).exec();
        // console.log(`sendTx....started ${this.txArr.length} tx`)
        if (this.txArr.length > 0) {
          clearInterval(this.sendTask);
          this.sendTask = setInterval(this.sendProcess.bind(this), 2000)
        }
      }
    }.bind(this),3000)
    setInterval(this.collectReceipt.bind(this), 3000);
  }

  async sendProcess(){
      if(this.txArr && this.txArr.length!=0){
          let tx = this.txArr.pop();
          await this.sendTx(tx);
      }
  }

  async sendTx(tx){
        try {
            let gasss = await this.web3.eth.getGasPrice();
            let power = await this.web3.etz.getPower(tx.sender)
            power = this.web3.utils.fromWei(String(power), 'gwei')
            if(power>9797776){
              
              let nonce = await this.web3.eth.getTransactionCount(tx.sender, "pending");
              var txObject = await this.web3.eth.accounts.signTransaction({
                from:tx.sender,
                to: tx.address,
                data: tx.data,
                gasPrice: gasss,
                gas: "1000000",
                nonce: nonce,
                value:tx.value
             },"0x"+this.accountMap.get(tx.sender))//accounts.get(tx.sender)
              this.nonce = Number(this.nonce)+1;
              this.web3.eth.sendSignedTransaction(txObject.rawTransaction)
                .once('transactionHash', this.onSended(tx._id))
                .once('error', this.onError(tx._id))
              await this.onSended(tx._id)(null);
            }
        } catch (e) {
            console.error("first err:",e);
            return null;
        }
    }

   onSended(e_id){
     return async (hash) => {
       console.log("sended hash---",hash);
       await Transaction.updateOne({"_id":e_id},{$set:{txhash:hash,state:1}}).exec();
     }
    }

   onError(e_id){
     var doerror = async (error) => {
       console.log("error:",error);
       await Transaction.updateOne({"_id":e_id},{$set:{state:3}}).exec();
     }
     return doerror;
    }

    async collectReceipt() {
      if (this.isCollecting) {
        return;
      }
      let transactions = await Transaction.find({txhash:{ $ne: null }, state:1,net_kind:"etz"}).exec();
      let blockNumber = await this.web3.eth.getBlockNumber();
      for (var i = 0; i < transactions.length; i++) {
        this.isCollecting = true;
        try {
          let receipt = await this.web3.eth.getTransactionReceipt(transactions[i].txhash);
          if (!receipt || receipt.blockNumber + 5 > blockNumber) {
            continue;
          }
          if (receipt.status == true) {
            await Transaction.updateOne({"_id":transactions[i]._id},{receipt:receipt,state:2}).exec();
          } else if (receipt.status == false) {
            await Transaction.updateOne({"_id":transactions[i]._id},{receipt:receipt,state:3}).exec();
          }
        } catch (e) {
          console.log(e);
        }
      }
      this.isCollecting = false;
    }
}

var etz = new EtzClass()
etz.start()
