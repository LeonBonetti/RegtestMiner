const exec = require('child_process').exec;
const containers = require('./Containers.json')
const request = require('request')

setInterval(()=>{
    containers.containers.map((container) => {
        // validator if container exist
        exec("docker ps | grep " + container.name, (err, stdout, stderr) => {
            if (err) return console.log('404', container.name)
            if (stdout.length > 0) {
                exec('docker exec ' + container.name + ' ps ax | grep ' + container.process, (err, stdout) => {
                    if (err) return console.log('400', container.process, err)
                    if (stdout.length > 0) {
                        const credentials = SplitAndSearch(stdout, ["rpcuser", "rpcpassword", "rpcport", "rpcbind"])
                        let rpcuser, rpcpassword, rpcport, rpcbind
                        credentials.map((item)=>{
                            if(item.indexOf('rpcuser') > -1) rpcuser = item.split('=')[1]
                            if(item.indexOf('rpcpassword') > -1) rpcpassword = item.split('=')[1]
                            if(item.indexOf('rpcport') > -1) rpcport = item.split('=')[1]
                            if(item.indexOf('rpcbind') > -1) rpcbind = item.split('=')[1]
                        })
    
                        SendRequest({rpcuser, rpcpassword, rpcport, rpcbind})
                    }
                })
            }
        })
    })    
}, 60000)


const SplitAndSearch = (command, targets) => {
    let find = []
    commandArray = command.split(" ")
    targets.map((target) => {
        commandArray.map((command) => {
            if (command.indexOf(target) > -1) {
                find.push(command)
            }
        })
    })

    if(find.length > 0){
        return find
    }
}

const SendRequest = async (credentials) => {
    const headers = {
        'content-type': 'application/json;'
    }
    const dataToSend = {"jsonrpc": 1.0, "id":"miner", "method": "generate", "params": [1]}

    const dataString = JSON.stringify(dataToSend)

    const options = {
        url: 'http://'+credentials.rpcbind+':'+credentials.rpcport,
        method: 'POST',
        headers: headers,
        body: dataString,
        auth: {
            'user': credentials.rpcuser,
            'pass': credentials.rpcpassword
        }
    }

    await request(options, (error, response, body)=>{
        if(error) console.log({fail: true, error})
        console.log(JSON.parse(response.statusCode))
    })

}