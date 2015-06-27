var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var fs = require('fs');
var _ = require('underscore');

var Sequelize = require('sequelize');
var PostModel = require('../model/post_model');
var IterationModel = require('../model/iteration_model');
var VersionModel = require('../model/version_model');
var ProjectModel = require('../model/project_model');
var StoryModel = require('../model/story_model');
var TaskModel = require('../model/task_model');

var Logger = require('../library/logger');

/* GET home page. */
router.get('/', function (req, res) {
  res.end('welcome!');
});

router.get('/async', function (req, res) {
//  async.series([
//    function (cb) {
//      console.log(1);
//      cb(null, {world: 2});
//    },
//    function (cb) {
//      console.log(2);
//      cb(null, {hello: 1});
//    }
//  ], function (err, result) {
//    if (err) {
//      res.status(400);
//      res.json({msg: 'err message'});
//    } else {
//      res.json(result);
//    }
//  });

//  async.parallel([
//    function (cb) {
//      console.log(1);
//      cb();
////      cb(null, {world: 2, xxx: 222}, {xxxxx: 2222});
//    },
//    function (cb) {
//      console.log(2);
//      cb('dddd');
//    },
//    function (cb) {
//      console.log(3);
//      cb(null, {foo: 1});
//    },
//  ], function (err, result) {
//    if (err) {
//      res.status(400);
//      res.json({msg: 'err message'});
//    } else {
//      res.json(result);
//    }
//  });
  
  async.waterfall([
    function (cb) {
      cb(null, 'hello');
    },
    function (arg, cb) {
      cb(null, arg, 'world');
    },
    function (arg1, arg2, cb) {
      cb(null, arg1, arg2);
    }
  ], function (err, result1, result2) {
    res.json(result1);
  });

//  async.map(['file1', 'file2', 'file3'], function () {
//    
//  }, function (err, result) {
//    if (err) {
//      res.status(400);
//      res.json({msg: err});
//    } else {
//      res.json(result);
//    }
//  });


//  var arr = ['file1', 'file2', 'file3'];
//  
//  arr.forEach(function (item) {
//    console.log(item);
//  });
//  res.json({msg: 'ok'});
  
//  var arr = ['file1', 'file2', 'file3'];
//  async.eachSeries(arr, function (item, cb) {
//    console.log(item);
//    if (item === 'file2') {
//      cb('file2', null);
//    } else {
//      cb(null);
//    }
//  }, function (err) {
//    if (err) {
//      res.status(400);
//      res.json({msg: 'err message'});
//    } else {
//      res.json({msg: 'ok'});
//    }
//  });
  
//  var arr = ['file1', 'file2', 'file3'];
//  async.each(arr, function (item, cb) {
//    console.log(item);
//    if (item === 'xxx') {
//      cb('xxx');
//    } else {
//      cb(null);
//    }
//  }, function (err) {
//    if (err) {
//      res.status(400);
//      res.json({msg: err});
//    } else {
//      res.json({msg: 'ok'});
//    }
//  });
});

/**
 * 导入end_time
 */
router.get('/endtime', function (req, res) {
  TaskModel
    .findAll()
    .then(function (tasks) {
      async.each(tasks, function (task) {
        if (task.isCompleted()) {
          return;
        }
        if (task.end_time === 0 && task.start_time !== 0) {
          task
            .update({
              end_time: task.start_time
            });
        }
      }, function (err) {
        console.log(err);
      });
    });
    res.json({msg: 'ok'});
});

/**
 * 将未完成的任务end_time重置0
 */
router.get('/repair_endtime', function (req, res) {
  TaskModel
    .findAll({
      where: {status_id: {$ne: 50}, end_time: {$ne: 0}}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        task.update({end_time: 0});
      }, function (err) {
        console.log(err);
      });
    });
  res.json({msg: '重置完成'});
});

/**
 * 将待开发的start_time重置0
 */
router.get('/repair_starttime', function (req, res) {
  TaskModel
    .findAll({
      where: {status_id: 10, start_time:{$ne: 0}}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        task.update({start_time: 0});
      }, function (err) {
        console.log(err);
      });
    });
  res.json({msg: '重置完成'});
});

/**
 * 将start_time=0的记录值为4.30
 */
router.get('/starttime', function (req, res) {
  TaskModel
    .findAll({
      where: {start_time: 0, status_id: 50}
    })
    .then(function (tasks) {
      async.each(tasks, function (task) {
        var props = {
          start_time: moment('2015-04-30', 'YYYY-MM-DD').unix()
        };
        if (task.end_time === 0) {
          props.end_time = moment('2015-04-30', 'YYYY-MM-DD').unix()
        }
        task.update(props);
      }, function (err) {
        res.json(err);
      });
    });
  res.json({msg: 'ok'});
});

module.exports = router;
