var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');

var IterationModel = require('../model/iteration_model');
var TaskModel = require('../model/task_model');
var StoryModel = require('../model/story_model');
var VersionModel = require('../model/version_model');
var TaskFollowModel = require('../model/task_follow_model');
var UserModel2 = require('../model/user_model');
var TaskStatusModel = require('../model/task_status_model');
var TaskHistoryModel = require('../model/task_history_model');
var TaskService = require('../service/task_service');
var TaskConcernedModel = require('../model/task_concerned_model');

// 呈现列表
router.get('/', function (req, res, next) {
  if (req.query.iteration_id) {
    checkIterationId(req, res, next);
  } else {
    next();
  }
});
router.get('/', function (req, res, next) {
  if (req.query.user_id) {
    checkUserId(req, res, next);
  } else {
    next();
  }
});
router.get('/', function (req, res) {
  var where = {
    status: TaskModel.statusOnline, // 在线的任务
  };
  if (req.query.user_id) { // 获取某个用户
    where.user_id = req.query.user_id;
  }
  if (req.query.iteration_id) { // 获取迭代对应的
    where.iteration_id = req.query.iteration_id;
  }

  TaskModel
    .findAll({
      where: where,
      include: [
        {model: UserModel2},
        {model: TaskStatusModel},
        {model: TaskFollowModel},
        {model: TaskHistoryModel}
      ],
      order: 'id DESC',
      offset: req.query.offset || 0,
      limit: req.query.size || 10
    })
    .then(function (result) {
      res.json(result);
    });
});

// 新建任务
router.post('/', checkIterationId);
router.post('/', checkStoryId);
router.post('/', checkUserId);
router.post('/', checkPrevTaskIds);
router.post('/', checkTaskStausId);
router.post('/', checkVersionId);
router.post('/', function (req, res, next) { // 添加任务
  TaskModel
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
      status_id: req.body.task_status_id,
      create_time: moment().unix()
    })
    .save()
    .then(function (task) {
      res.json({id: task.id});
      req.taskId = task.id;
      next();
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });

});
router.post('/', function (req) { // 前置任务添加
  req.prevTaskIds.forEach(function (prevTaskId) {
    TaskFollowModel
      .build({
        task_id: req.taskId,
        prev_task_id: prevTaskId,
        create_time: moment().unix()
      })
      .save();
  });
});

// 编辑任务
router.put('/:id', checkTaskId);
router.put('/:id', checkIterationId);
router.put('/:id', checkVersionId);
router.put('/:id', checkUserId);
router.put('/:id', checkStoryId);
router.put('/:id', checkPrevTaskIds);
router.put('/:id', function (req, res, next) {
  req.task
    .updateAttributes({
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
    })
    .then(function (task) {
      res.json({id: task.id});
      next();
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });
});
router.put('/:id', function (req) {
  async.series([
    // 清除老的
    function (callback) {
      TaskFollowModel
        .findAll({
          where: {task_id: req.task.id}
        })
        .then(function (tasks) {
          tasks.forEach(function (task) {
            task.destroy();
          });
          callback(null);
        });
    },
    // 新增
    function () {
      req.prevTaskIds.forEach(function (prevTaskId) {
        TaskFollowModel
          .build({
            task_id: req.task.id,
            prev_task_id: prevTaskId,
            create_time: moment().unix()
          })
          .save();
      });
    }
  ]);
});

// 删除任务
router.delete('/:id', checkTaskId);
router.delete('/:id', function (req, res) {
  req.task
    .updateAttributes({
      status: TaskModel.statusOffline
    })
    .then(function () {
      res.json({msg: '删除成功'});
    });
});

// 拉动任务
router.put('/:id/status', checkTaskId);
router.put('/:id/status', checkTaskStausId);
router.put('/:id/status', function (req, res, next) {
  req.task.drag(req.body.task_status_id);
  res.json({id: req.task.id});
  next();
});
router.put('/:id/status', function (req) { // 前置任务完成则推送99U
  // 判断是否开发完成
  if (!TaskStatusModel.isDragToComplete(req.body.task_status_id)) {
    return;
  }

  // 发送
  TaskService.send91umsg(req.task);
  TaskService.sendConcernedMsg(req.task);
});

// 关注任务
router.post('/:id/concerned', checkTaskId);
router.post('/:id/concerned', checkUserId);
router.post('/:id/concerned', function (req, res, next) { // 判断是否关注
  TaskConcernedModel
    .find({
      where: {
        task_id: req.params.id,
        user_id: req.body.user_id
      }
    })
    .then(function (taskConcerned) {
      if (taskConcerned === null) {
        next();
      } else {
        res.status(400);
        res.json({msg: '已关注'});
      }
    });
});
router.post('/:id/concerned', function (req, res) {
  TaskConcernedModel
    .build({
      task_id: req.params.id,
      user_id: req.body.user_id,
      create_time: moment().unix()
    })
    .save()
    .then(function () {
      res.json({msg: '关注成功'});
    })
    .catch(function (err) {
      res.status(500);
      res.json(err.errors);
    });
});

function checkUserId(req, res, next) {
  UserModel2
    .find(req.param('user_id'))
    .then(function (user) {
      if (user === null) {
        res.status(404);
        res.json({msg: '用户不存在'});
      } else {
        next();
      }
    });
}
function checkTaskStausId(req, res, next) {
  TaskStatusModel
    .find(req.body.task_status_id)
    .then(function (taskStatus) {
      if (taskStatus === null) {
        res.status(404);
        res.json({msg: '请提供正确的状态'});
      } else {
        next();
      }
    });
}
function checkVersionId(req, res, next) {
  VersionModel
    .find(req.iteration.version_id)
    .then(function (version) {
      if (version === null) {
        res.status(404);
        res.json({msg: '迭代对应的版本号记录不存在.'});
      } else {
        req.version = version;
        next();
      }
    });
}
function checkStoryId(req, res, next) {
  StoryModel
    .find(req.param('story_id'))
    .then(function (story) {
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
  IterationModel
    .find(req.param('iteration_id'))
    .then(function (iteration) {
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
function checkTaskId(req, res, next) {
  TaskModel
    .find(req.params.id)
    .then(function (task) {
      if (task === null) {
        res.status(404);
        res.json({msg: '任务不存在'});
      } else {
        req.task = task;
        next();
      }
    });
}
function checkPrevTaskIds(req, res, next) {
  if (req.body.prev_task_ids === undefined) {
    req.prevTaskIds = [];
  } else {
    req.prevTaskIds = req.body.prev_task_ids;
  }
  next();
}

module.exports = router;