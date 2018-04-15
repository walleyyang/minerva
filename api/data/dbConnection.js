/*
@author: Walley Yang
*/
const MongoClient = require('mongodb').MongoClient
let url = 'mongodb://localhost:27017'
let _connection = null

let open = function() {
    MongoClient.connect(url, function(err, client) {
        if(err) {
            console.log('MongoDB failed to connect.')
            return
        }
        
        _connection = client.db('minerva')
        console.log("MongoDB connected!")
    })
}

let get = function() {
    return _connection
}

module.exports = {
    open : open,
    get :get
}