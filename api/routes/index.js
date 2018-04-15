/*
@author: Walley Yang
*/
let express = require('express')
let router = express.Router()

let newsController = require('../controllers/news.controller.js')

router
    .route('/news')
    .get(newsController.newsGetAll)

router
    .route('/news/:_id')
    .get(newsController.newsGetOne)

module.exports = router