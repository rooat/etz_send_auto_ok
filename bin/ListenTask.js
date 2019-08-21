var config = require('../config');
var abi = require('../config/abi.json')

class ETZEventListener {
  constructor() {
    this.COMFIRM = 3;
    this.currentBlockNumber =0;
    this.netBlock = 0;
    this.sender = "0xEd5a84260337f2B5dB585206eCcBf2Fdaf43d263";
    this.gameContract = "0xc0c60e6cdb0a59d6ef611c763e207e7bd00fed84";
    this.instanceToken =new config.web3.eth.Contract(abi,this.gameContract);
  }
  async start(){
    this.currentBlockNumber = await config.web3.eth.getBlockNumber()
    this.netBlock = this.currentBlockNumber;
    console.log("init blockNumber==",this.currentBlockNumber)
    this.currentBlockNumber++
    this.task()
  }
  task(){
    let that = this
    setInterval(async function(){
        let nextBlock = await config.web3.eth.getBlockNumber()
        if(that.netBlock <= nextBlock){
          that.netBlock = nextBlock;
           console.log("blockNumber==",that.netBlock)
           that.exFun()
           that.netBlock++;
        }
        
      },1000);
  }
  async exFun(){
      if (this.currentBlockNumber < this.netBlock) {
          let cur = this.currentBlockNumber;
          this.currentBlockNumber = this.netBlock;
          for (let i = cur; i < this.netBlock; i++) {
            config.web3.eth.getBlock(i - this.COMFIRM, true).then(async(block) => {
              if(block.transactions.length>0){
                for (let ii = 0; ii < block.transactions.length; ii++) {
                  let txhash = block.transactions[ii].hash;
                  let receipt = await config.web3.eth.getTransaction(txhash)
                  if(receipt){
                    let etz_to = receipt.to;
                    if(etz_to.toLocaleLowerCase() == this.gameContract.toLocaleLowerCase()){
                      let input_s = receipt.input;
                      let input_str = input_s.substr(0,10);
                      let phenixIndex = Number(input_s.substr(10,64));
                      console.log("input_str===",input_str);
                      if(input_str == "0x7a0dedf6") {//feed
                        let value = receipt.value;
                        let from = receipt.from;
                        console.log("用户喂养:地址:"+from+",喂养金额："+value+",区块高度："+receipt.blockNumber);
                        await config.Logset({
                          task:"feed"
                        }).save()
                      }else if(input_str == "0xe70ee385"){
                        console.log("公告新的轮次")
                        await config.Logset({
                          task:"公告新的轮次"
                        }).save()
                      }else if(input_str == "0x1cecff48"){//开启轮次
                        console.log("在仓位："+phenixIndex+",新的轮次开启成功！区块高度："+receipt.blockNumber);
                        this.createTransaction(phenixIndex); 
                        await config.Logset({
                          task:"新的轮次开启成功"
                        }).save() 
                      }else if(input_str == "0xaa2d6081"){//创建仓位
                        console.log("开启新的仓位！");
                        await config.Logset({
                          task:"开启新的仓位"
                        }).save() 
                      }else if(input_str == "0xd66d6c10"){
                        console.log("注册新用户")
                        await config.Logset({
                          task:"注册新用户"
                        }).save()
                      }else if(input_str == "0xb6b55f25"){
                        console.log("用户充值成功");
                        await config.Logset({
                          task:"用户充值成功"
                        }).save()
                      }
                    }
                  }
                }
              }
            })
          }
       }
  }
  async createTransaction(phenixIndex){
    let maxRound =await this.instanceToken.methods.getMaxRoundIndex(phenixIndex).call();
    let phenixRoundData = await this.instanceToken.methods.getRound(phenixIndex,maxRound).call();
    let accountData = await this.instanceToken.methods.account(this.sender,0).call();
   
    let invetsVal = accountData.balance;
    if(accountData.balance > phenixRoundData.maxInvest){
      invetsVal = phenixRoundData.maxInvest;
    }
    invetsVal = config.web3.utils.toWei(String(Number(invetsVal)/10**18),'ether');
    let data= await this.instanceToken.methods.feed(0,phenixIndex,invetsVal).encodeABI();
    await config.Transaction({
        "net_kind" : "etz",
        "sender":this.sender.toLocaleLowerCase(),
        "address":this.gameContract,
        "data":data
      }).save()
  }
}

var listener = new ETZEventListener()
listener.start()