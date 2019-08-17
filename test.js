var config = require('./config')
var abi = require('./config/abi2.json')
var sender = "0x65E7801bd4b036081dAE9280Ec1b156b39d11Af5"
//var contract_add = "0xc0c60e6cdb0a59d6ef611c763e207e7bd00fed84"
var contract_add = "0xf2e95d6F75897e6501e185d218504995F300deb4"
async function test_tx(contract){
  // let contract_obj = await config.Contracts.findOne({"address":contract});
  // if(contract_obj){
    // let abi_json = JSON.parse(abi);
  //  let instanceToken =new config.web3.eth.Contract(abi,contract);

    await config.Transaction({
        "net_kind" : "etz",
        "sender":sender.toLocaleLowerCase(),
        "address":contract_add,
        "data":"",
        "value":0.01*10**18
      }).save()
}
test_tx()



// var config = require('./config')
// var abi = require('./config/abi.json')
// var sender = "0x65E7801bd4b036081dAE9280Ec1b156b39d11Af5"
// var contract_add = "0xd743c5933d9c297fd9a1ceb2cfd258c53a8bf7c1"
// async function test_tx(contract){
//   // let contract_obj = await config.Contracts.findOne({"address":contract});
//   // if(contract_obj){
//     // let abi_json = JSON.parse(abi);
//     let instanceToken =new config.web3.eth.Contract(abi,contract);
//     let rand = parseInt(Math.random()*10000)
//     console.log("rand==",rand)
//     let data= await instanceToken.methods.transfer("0x23e48fd0f704309ED6D7c7A57CdF45625C09AFe3",rand).encodeABI();

//     await config.Transaction({
//         "net_kind" : "etz",
//         "sender":sender.toLocaleLowerCase(),
//         "address":contract,
//         "data":data
//       }).save()
// //  }
// }
// test_tx(contract_add.toLocaleLowerCase())

