var express = require('express');
var router = express.Router();

var PostModel = require('../model/post');

/* GET home page. */
router.get('/', function(req, res) {
  PostModel.find(1).then(function(post) {
    console.log(post);
    res.json(post);
  });
});

module.exports = router;
