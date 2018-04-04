let dbConnection = require('../data/dbConnection.js')
let ObjectId = require('mongodb').ObjectId;

module.exports.newsGetAll = function(req, res) {
    let db = dbConnection.get()
    let collection = db.collection('news')
    let offset = 0;
    let count = 20;

    collection
        .find()
        .skip(offset)
        .limit(count)
        .toArray(function(err, docs) {
            console.log("Found articles", docs)
            res
                .status(200)
                .json(docs)
        })
}

module.exports.newsGetOne = function(req, res) {
    let db = dbConnection.get()
    let collection = db.collection('news')
    let id = req.params._id

    collection
        .findOne({
            _id: ObjectId(id)
        }, function(err, doc) {
            res
                .status(200)
                .json(doc)
        })
}