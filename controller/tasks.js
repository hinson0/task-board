var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');

var IterationModel2 = require('../model/iteration2');
var TaskModel2 = require('../model/task2');
var StoryModel2 = require('../model/story2');
var VersionModel2 = require('../model/version2');
var TaskFollow2 = require('../model/task_follow2');
var UserModel2 = require('../model/user2');
var TaskStatusModel2 = require('../model/task_status2');
var TaskService = require('../service/task');

// 呈现列表
router.get('/', checkIterationId);
router.get('/', function(req, res) {
  TaskModel2
    .findAll({
      where: {
        iteration_id: req.query.iteration_id,
        status: TaskModel2.statusOnline,
      },
      include: [
        {model: UserModel2},
        {model: TaskStatusModel2},
        {model: TaskFollow2},
      ],
      order: 'id DESC',
    })
    .then(function(result) {
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
      status_id: req.body.task_status_id,
      create_time: moment().unix()
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

// 编辑任务
router.put('/:id', checkTaskId);
router.put('/:id', checkIterationId);
router.put('/:id', checkVersionId);
router.put('/:id', checkUserId);
router.put('/:id', checkStoryId);
router.put('/:id', checkPrevTaskIds);
router.put('/:id', function(req, res, next) {
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
      .then(function(task) {
        res.json({id: task.id});
        next();
      })
      .catch(function(err) {
        res.status(500);
        res.json(err.errors);
      });
});
router.put('/:id', function(req, res) {
  async.series([
    // 清除老的
    function(callback) {
      TaskFollow2
        .findAll({
          where: {task_id: req.task.id}
        })
        .then(function(tasks) {
          tasks.forEach(function(task) {
            task.destroy();
          });
          callback(null);
        });
    },
    // 新增
    function() {
      req.prevTaskIds.forEach(function(prevTaskId) {
        TaskFollow2
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
router.delete('/:id', function(req, res) {
  req.task
    .updateAttributes({
      status: TaskModel2.statusOffline
    })
    .then(function() {
      res.json({msg: '删除成功'});
    });
});

// 拉动任务
router.put('/:id/status', checkTaskId);
router.put('/:id/status', checkTaskStausId);
router.put('/:id/status', function(req, res, next) {
  req.task.drag(req.body.task_status_id);
  res.json({id: req.task.id});
  next();
});
router.put('/:id/status', function(req) { // 前置任务完成则推送99U
  // 判断是否开发完成
  if (!TaskStatusModel2.isDragToComplete(req.body.task_status_id)) {
    return;
  }
  
  // 发送
  TaskService.send91umsg(req.task);
});

function checkUserId(req, res, next) {
  UserModel2
    .find(req.body.user_id)
    .then(function(user) {
      if (user === null) {
        res.status(404);
        res.json({msg: '用户不存在'});
      } else {
        next();
      }
    });
}
function checkTaskStausId(req, res, next) {
  TaskStatusModel2
    .find(req.body.task_status_id)
    .then(function(taskStatus) {
      if (taskStatus === null) {
        res.status(404);
        res.json({msg: '请提供正确的状态'});
      } else {
        next();
      }
    });
}
function checkVersionId(req, res, next) {
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
function checkPrevTaskIds(req, res, next) {
  if (req.body.prev_task_ids === undefined) {
    req.prevTaskIds = [];
  } else {
    req.prevTaskIds = req.body.prev_task_ids;
  }
  next();
}

module.exports = router;