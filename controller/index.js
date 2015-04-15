var express = require('express');
var router = express.Router();

var PostModel = require('../model/post');
var IterationModel = require('../model/iteration2');
var VersionModel = require('../model/version2');
var ProjectModel = require('../model/project2');

/* GET home page. */
router.get('/', function(req, res) {
  IterationModel
    .find({
      where: {
        id: 21
      },
      include: [
        {model: VersionModel, include: [ProjectModel]},
      ]
    })
    .then(function(iteration) {
      res.json(iteration);
    });
});

module.exports = router;
