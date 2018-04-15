/*
@author: Walley Yang
*/
let dbConnection = require('../data/dbConnection.js')
let ObjectId = require('mongodb').ObjectId;

module.exports.newsGetAll = function (req, res) {
    let db = dbConnection.get()
    let collection = db.collection('news')
    let offset = 0;
    let count = 1000;

    collection
        .find()
        .skip(offset)
        .limit(count)
        .sort({"$natural": -1})
        .toArray(function (err, docs) {
            getData(docs, function(result) {
                res
                .status(200)
                .json(result)
            })
        })
}

module.exports.newsGetOne = function (req, res) {
    let db = dbConnection.get()
    let collection = db.collection('news')
    let id = req.params._id

    collection
        .findOne({
            _id: ObjectId(id)
        }, function (err, doc) {
            res
                .status(200)
                .json(doc)
        })
}

function getData(docs, callback) {
    let data = []

    getTweets(function(tweets) {
        for(let tweet of tweets) {
            let tweetNewsID = tweet['news'].news_id
            let tweetQuery = tweet['news'].query

            for(let doc of docs) {
                let newsID = doc['_id']
                let person = uniqueEntity(doc['PERSON'])
                let org = uniqueEntity(doc['ORG'])

                delete doc.PERSON
                delete doc.ORG

                doc["PERSON"] = person
                doc["ORG"] = org

                if(parseInt(newsID) == parseInt(tweetNewsID)) {
                    if(person.length == 0 && org.length == 0) {
                        continue
                    }
            
                    if(person.length > 0) {
                        if(person.includes(tweetQuery)) {      
                            if(!tweetExists(tweet, data)) {
                                doc["twitter"] = tweet
                                data.push(doc)
                            }   
                        }
                    }
            
                    if(org.length > 0) {
                        if(org.includes(tweetQuery)) {
                            if(!tweetExists(tweet, data)) {
                                doc["twitter"] = tweet
                                data.push(doc)
                            }
                        }
                    }
                }
            }
               
        }

        callback(data)
    })    
}

function uniqueEntity(entity) {
    return Array.from(new Set(entity))
}

function tweetExists(tweet, data) {
    let exists = false
    let newsId
    let twitterNewsId

   for(let doc of data) {
       newsId = doc["twitter"]["news"].news_id
       twitterNewsId = tweet["news"].news_id
       
       if(newsId == twitterNewsId) {
           exists = true
       }
   }
   
   return exists
}

function getTweets(callback) {
    let db = dbConnection.get()
    let collection = db.collection('twitter')
    let count = 100

    collection
        .find()
        .limit(count)
        .sort({"$natural": -1})
        .toArray(function (err, docs) {
            callback(docs)
        })
}