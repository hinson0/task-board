var express = require('express');
var router = express.Router();
var async = require('async');
var moment = require('moment');
var querystring = require('querystring');

var VersionModel = require('../model/version_model');
var RouterService = require('../service/router_service');
var TaskModel = require('../model/task_model');
var UserModel = require('../model/user_model');
var StoryModel = require('../model/story_model');
var IterationModel = require('../model/iteration_model');

// 工时统计
router.get('/hours', checkVersionId);
router.get('/hours', function (req, res) { // 获取统计工时
  var where = {};
  if (req.query.version_id) { // 支持版本id
    where.version_id = req.version.id;
  }
  if (req.query.iteration_id) { // 支持迭代id
    where.iteration_id = req.query.iteration_id;
  }
  if (req.query.start_time || req.query.end_time) {
    where.end_time = {};
    if (req.query.start_time) {
      where.end_time.$gte = req.query.start_time;
    }
    if (req.query.end_time) {
      where.end_time.$lte = req.query.end_time;
    }
  }
  TaskModel
    .findAll({
      where: where,
      include: [
        {model: UserModel},
        {model: VersionModel, where: {status: VersionModel.statusOnline}},
        {model: IterationModel, where: {status: IterationModel.statusOnline}}
      ],
      order: 'user_id ASC'
    })
    .then(function (tasks) {
      res.json(tasks);
    });
});

// 故事统计
router.get('/story', checkVersionId);
router.get('/story', function (req, res, next) {
  if (req.query.iteration_id) {
    checkIterationId(req, res, next);
  } else {
    next();
  }
});
router.get('/story', function (req, res) {
  async.waterfall([
    function (callback) { // 获取story
      var where = {};
      if (req.query.version_id) { // 支持版本id
        where.version_id = req.version.id;
      }
      StoryModel
        .findAll({
          where: {version_id: req.version.id}
        })
        .then(function (stories) {
          if (stories === null) {
            callback('empty story');
          } else {
            callback(null, stories);
          }
        });
    },
    function (stories, callback) { // 获取任务
      async.map(stories, function (story, cb) {
        var where = {
          version_id: story.version_id,
          story_id: story.id
        };
        if (req.query.iteration_id) {
          where.iteration_id = req.query.iteration_id;
        }
        TaskModel
          .findAll({
            where: where,
          })
          .then(function (tasks) {
            story.setDataValue('tasks', tasks);
            cb(null, story);
          });
      }, function (err, stories) {
        callback(err, stories);
      });
    }
  ], function (err, result) {
    if (err) throw err;
    res.json(result);
  });
});

// 燃尽图
router.get('/bdc', checkVersionId);
router.get('/bdc', function (req, res, next) {
  if (req.query.iteration_id) {
    checkIterationId(req, res, next);
  } else {
    next();
  }
});
router.get('/bdc', function (req, res) {
  async.waterfall([
    function (callback) { // 获取X（时间）坐标
      var dates = [];
      if (req.query.iteration_id) {
        dates = req.iteration.getDates();
      } else {
        dates = req.version.getDates();
      }
      callback(null, dates);
    },
    function (dates, callback) { // 改造时间格式
      /**
       * 由['20150101', '20150102', ...] => 弄成{20150101: 0, 20150102: 0, 20150103: 0, ...}
       */
      var details = {};
      dates.forEach(function (date) {
        details[date] = 0;
      });
      callback(null, dates, details);
    },
    function (dates, details, callback) { // 获取任务
      var where = {
        version_id: req.version.id
      };
      if (req.query.iteration_id) {
        where.iteration_id = req.query.iteration_id;
      }
      TaskModel
        .findAll({
          where: where
        })
        .then(function (tasks) {
          callback(null, dates, details, tasks);
        });
    },
    function (dates, details, tasks, callback) { // 计算任务
      var totalHours = 0;
      var msgs = [];
      async.each(tasks, function (task, cb) {
        msgs.push('-----');
        
        // 计算总估时
        totalHours += task.estimated_time;
        
        // 没有完成，则忽略
        if (!task.isCompleted()) {
          var msg = '任务[' + task.desc + ']尚未完成。';
          msgs.push(msg);
          cb(null);
          return;
        }
        
        // 检查结束时间
        var endDate = moment(task.end_time, 'X');
        if (!endDate.isValid()) {
          var msg = '任务[' + task.desc + ']的结束时间为[' + task.end_time + ']解析错误，因此忽略';
          msgs.push(msg);
          cb(null);
          return;
        }
        
        var format = endDate.format('YYYYMMDD');
        var msg = '任务[' + task.desc + ']开始统计工时，工时为[' + task.estimated_time + ']，时间为[' + format + ']';
        msgs.push(msg);
        
        // 判断时间是否在范围
        if (!(format in details)) {
          var msg = '任务[' + task.desc + ']，工时为[' + task.estimated_time + ']，不在时间段内[' + dates.toString() + ']，因此忽略统计。';
          msgs.push(msg);
          cb(null);
          return;
        }
        
        // 计算完成工时
        var msg = '时间[' + format + ']完成任务[' + task.desc + ']，获得[' + task.estimated_time + ']小时的统计。';
        msgs.push(msg);
        details[format] += task.estimated_time;
        
        cb(null);
      }, function (err) {
        callback(err, details, totalHours, msgs);
      });
    }
  ], function (err, details, totalHours, msgs) {
    if (err) throw err;
    var result = {total: totalHours, details: details};
    if (req.query.debug) {
      result.msgs = msgs;
    }
    res.json(result);
  });
});

function isGetByVersionId(req) {
    if (req.query.version_id && !req.query.recently) {
        return true;
    }
    return false;
}
function isGetByIterationId(req) {
    return req.query.iteration_id ? true : false;
}

function checkVersionId(req, res, next) { // 检查版本
  VersionModel
    .find(req.query.version_id)
    .then(function (version) {
      if (version === null) {
        res.status(400);
        res.json({msg: '版本不存在'});
      } else {
        req.version = version;
        next();
      }
    });
}
function checkIterationId(req, res, next) { // 检查迭代
  IterationModel
    .find(req.query.iteration_id)
    .then(function (iteration) {
      if (iteration === null) {
        res.status(400);
        res.json({msg: '迭代不存在'});
      } else {
        req.iteration = iteration;
        next();
      }
    });
}

module.exports = router;