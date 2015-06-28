var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var _ = require('underscore');

var Sequelize = require('sequelize');
var IterationModel = require('../model/iteration_model');
var VersionModel = require('../model/version_model');
var ProjectModel = require('../model/project_model');
var TaskModel = require('../model/task_model');

var Logger = require('../library/logger');

/* GET home page. */
router.get('/', function (req, res) {
  res.end('welcome!');
});

module.exports = router;
