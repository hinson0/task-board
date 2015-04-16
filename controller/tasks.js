var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');

var Helper = require('../library/helper');
var UserModel = require('../model/user');
var StoryModel = require('../model/story');
var TaskModel = require('../model/task');
var TaskStatusModel = require('../model/task_status');
var TaskFollow = require('../model/task_follow');
var IterationModel = require('../model/iteration');
var VersionModel = require('../model/version');
var Msg91U = require('../library/msg91u');

var IterationModel2 = require('../model/iteration2');
var TaskModel2 = require('../model/task2');
var StoryModel2 = require('../model/story2');
var VersionModel2 = require('../model/version2');
var TaskFollow2 = require('../model/task_follow2');

router.get('/test', function(req, res) {
    UserModel.getAll(function(users) {
        async.each(users, function(user, callback) {
            var msg91u = new Msg91U(user.worker_num);
            msg91u.send('淡定淡定...');
            res.json({msg: 'xxxx'});
        }, function(err) {
            res.status(404);
            res.json(err);
        });
    });
});

router.get('/', checkIterationId);
router.get('/', function(req, res, next) {
    StoryModel.getListByIterationId(req.query.iteration_id, function(stories) {
        if (Helper.isEmptyArray(stories)) {
            res.json([]);
        } else {
            var storyIds = [];
            stories.forEach(function(story) {
                storyIds.push(story.id);
            });
            TaskModel.getListByStoryIds(storyIds, function(list) {
                //res.json(list);
                req.list = list;
                next();
            });
        }
    });
}, function(req, res) {
    req.list.forEach(function(task) {

    });
    res.json(req.list);
});

router.post('/', checkIterationId);
router.post('/', checkStoryId);
router.post('/', checkUserId);
router.post('/', checkPrevTaskIds);
router.post('/', checkTaskStausId);
router.post('/', function(req, res, next) {
  VersionModel2
    .find(req.iteration.version_id)
    .then(function(version) {
      if (version === null) {
        res.status(404);
        res.json({msg: '迭代对应的版本号记录不存在.'});
      } else {
        req.version = version;
        next();
      }
    });
});
router.post('/', function(req, res, next) { // 添加任务
  TaskModel2
    .build({
      project_id: req.version.project_id,
      version_id: req.version.id,
      iteration_id: req.iteration.id,
      story_id: req.story.id,
      user_id: req.body.user_id,
      desc: req.body.desc,
      is_new: req.body.is_new,
      is_challenging: req.body.is_challenging,
      priority: req.body.priority,
      estimated_time: req.body.estimated_time,
      status_id: req.body.status_id,
      start_time: req.body.start_time,
      create_time: req.body.create_time,
    })
    .save()
    .then(function(task) {
      res.json({id: task.id});
      req.taskId = task.id;
      next();
    })
    .catch(function(err) {
      res.status(500);
      res.json(err.errors);
    });
    
});
router.post('/', function(req) { // 前置任务添加
  req.prevTaskIds.forEach(function(prevTaskId) {
    TaskFollow2
      .build({
        task_id: req.taskId,
        prev_task_id: prevTaskId,
        create_time: moment().unix()
      })
      .save();
  });
});

router.put('/:id', checkIterationId);
router.put('/:id', checkTaskId);
router.put('/:id', checkUserId);
router.put('/:id', checkStoryId);
router.put('/:id', checkPrevTaskIds);
router.put('/:id', checkTaskStausId);
router.put('/:id', function(req, res, next) {
    TaskModel.modiById(req.params.id, req.body);
    next();
}, function(req, res) {
    async.series([
        // 清除老的
        function(callback) {
            TaskFollow.deleteByTaskId(req.params.id);
            callback(null);
        },
        // 新增
        function() {
            req.prevTaskIds.forEach(function(prevTaskId) {
                var taskFollow = new TaskFollow({task_id: req.params.id, prev_task_id: prevTaskId});
                taskFollow.save();
            });
        }
    ]);
    res.json({id: req.params.id});
});

router.delete('/:id', checkTaskId);
router.delete('/:id', function(req, res, next) {
    TaskModel.deleteById(req.params.id, function() {
        res.json({msg: '删除成功'});
        next();
    });
});

router.put('/:id/status', checkTaskId);
router.put('/:id/status', checkTaskStausId);
router.put('/:id/status', function(req, res) {
    TaskModel.changeStatusById(req.params.id, req.body.task_status_id);
    res.json({id: req.params.id});
});

function checkTaskId(req, res, next) {
  TaskModel2
    .find(req.params.id)
    .then(function(task) {
      if (task === null) {
        res.status(404);
        res.json({msg: '任务不存在'});
      } else {
        req.task = task;
        next();
      }
    });
}
function checkUserId(req, res, next) {
    UserModel.getById(req.body.user_id, function(userInfo) {
        if (Helper.isEmptyObj(userInfo)) {
            res.status(404);
            res.json({msg: '用户不存在'});
        } else {
            res.userInfo = userInfo;
            next();
        }
    });
}
function checkPrevTaskIds(req, res, next) {
    if (req.body.prev_task_ids === undefined) {
        req.prevTaskIds = [];
    } else {
        var prevTaskIds = req.body.prev_task_ids.toString();
        var prevTaskIdsSplit = prevTaskIds.split(',');
        if (Helper.isEmptyArray(prevTaskIdsSplit)) {
            req.prevTaskIds = [];
        } else {
            req.prevTaskIds = prevTaskIdsSplit;
        }
    }
    next();
}
function checkTaskStausId(req, res, next) {
    TaskStatusModel.getById(req.body.task_status_id, function(taskStatusInfo) {
        if (Helper.isEmptyObj(taskStatusInfo)) {
            res.status(404);
            res.json({msg: '请提供正确的状态'});
        } else {
            next();
        }
    });
}
function checkStoryId(req, res, next) {
  StoryModel2
    .find(req.param('story_id'))
    .then(function(story) {
      if (story === null) {
        res.status(404);
        res.json({msg: '故事不存在'});
      } else {
        req.story = story;
        next();
      }
    });
}
function checkIterationId(req, res, next) {
  IterationModel2
    .find(req.param('iteration_id'))
    .then(function(iteration) {
      if (iteration === null) {
        res.status(404);
        res.json({msg: '迭代计划不存在'});
      } else {
        if (iteration.isClosed()) {
          res.status(404);
          res.json({msg: '迭代计划已关闭,不能进行任何操作了.'});
        } else {
          req.iteration = iteration;
          next();
        }
      }
    });
}

module.exports = router;