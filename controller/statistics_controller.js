var express = require('express');
var router = express.Router();
var async = require('async');

var TaskModel = require('../model/task');
var IterationModel = require('../model/iteration');
var Helper = require('../library/helper');

var VersionModel = require('../model/version_model');
var RouterService = require('../service/router_service');
var TaskModel2 = require('../model/task_model');
var UserModel2 = require('../model/user_model');
var StoryModel2 = require('../model/story_model');
var IterationModel2 = require('../model/iteration_model');

var StatisticsService = require('../service/statistics_service');

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
  TaskModel2
    .findAll({
      where: where,
      include: [
        {model: UserModel2}
      ]
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
      StoryModel2
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
        TaskModel2
          .findAll({
            where: where
          })
          .then(function (tasks) {
            story.setDataValue('tasks', tasks);
            console.log(story);
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
//router.get('/bdc', function(req, res, next) {
//    if (req.query.version_id) {
//        checkVersionId(req, res, next);
//    } else if (req.query.iteration_id) {
//        checkIterationId(req, res, next);
//    } else {
//        res.status(404);
//        res.json({msg: '非法参数'});
//    }
//});
//router.get('/bdc', function(req, res, next) {
//    if (req.query.version_id) {
//        StatisticsService.dbcByVersionId(req.version.id, function(result) {
//            res.json(result);
//        });
//    } else {
//        next();
//    }
//}, function(req, res) {
//    if (req.query.iteration_id) {
//        StatisticsService.dbcByIterationId(req.iteration.id, function(result) {
//            res.json(result);
//        })
//    }
//});

router.get('/bdc', checkVersionId);
router.get('/bdc', function (req, res, next) {
  if (req.query.iteration_id) {
    checkIterationId(req, res, next);
  } else {
    next();
  }
});
router.get('/bdc', function (req, res) {

});

function checkIterationId(req, res, next) {
    IterationModel.getById(req.query.iteration_id, function(iteration) {
        if (Helper.isEmptyObj(iteration)) {
            res.status(404);
            res.json({msg: '迭代记录不存在'});
        } else {
            req.iteration = iteration;
            next();
        }
    });
}
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
  IterationModel2
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