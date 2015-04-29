var express = require('express');
var router = express.Router();

var TaskStatusModel = require('../model/task_status_model');

router.get('/', function (req, res) {
  TaskStatusModel
    .findAll()
    .then(function (result) {
      res.json(result);
    });
});

module.exports = router;