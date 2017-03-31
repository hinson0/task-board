var express = require('express');
var router = express.Router();
var moment = require('moment');
var async = require('async');
var _ = require('underscore');
var logger = require('../library/logger');

var IterationModel = require('../model/iteration_model');
var TaskModel = require('../model/task_model');
var VersionModel = require('../model/version_model');
var TaskFollowModel = require('../model/task_follow_model');
var UserModel = require('../model/user_model');
var TaskStatusModel = require('../model/task_status_model');
var TaskHistoryModel = require('../model/task_history_model');
var TaskConcernedModel = require('../model/task_concerned_model');
var StoryModel = require('../model/story_model');
var ProjectModel = require('../model/project_model');
var CsvModel = require('../model/csv_model');

var TaskService = require('../service/task_service');
var RouterService = require('../service/router_service');
var CsvService = require('../service/csv_service');
var UserService = require('../service/user_service');

// 全局
// router.use('/', UserService.checkSession);

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
    status: TaskModel.statusOnline // 在线的任务
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
        {model: UserModel},
        {model: TaskStatusModel},
        {model: TaskFollowModel},
        {model: TaskHistoryModel},
        {model: StoryModel, where: {status: StoryModel.statusOnline}},
        {model: IterationModel, where: {status: IterationModel.statusOnline}},
        {model: VersionModel},
        {model: ProjectModel},
        {model: TaskConcernedModel}
      ],
      order: 'status_id ASC',
      offset: parseInt(req.query.offset) || 0,
      limit: parseInt(req.query.size) || 10
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
    .create({
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
      create_time: moment().unix(),
      remark: req.body.remark || '',
      deadline: req.body.deadline || 0
    })
    .then(function (task) {
      req.task = task;
      next();
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });

});
router.post('/', function (req, res) { // 前置任务添加
  async.each(req.prevTaskIds, function (prevTaskId, callback) {
    TaskFollowModel
      .create({
        task_id: req.task.id,
        prev_task_id: prevTaskId,
        create_time: moment().unix()
      })
      .then(function () {
        callback();
      });
  }, function (err) {
    res.json({id: req.task.id});
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
  if (!UserService.isMe(req, req.body.user_id)) {
    TaskService.sendMsgWhenAuthorChanged(req.task, req.user, req.session.user);
  }
  next();
});
router.put('/:id', function (req, res, next) {
  req.task
    .update({
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
      remark: req.body.remark || '',
      deadline: req.body.deadline || 0
    })
    .then(function (task) {
      next();
    })
    .catch(function (err) {
      RouterService.json(err, res);
    });
});
router.put('/:id', function (req, res) { // 删除老的关联
  async.series([
    // 是否有前置任务
    function (callback) {
      if (req.prevTaskIds.length === 0) {
        callback(true);
      } else {
        callback(null);
      }
    },
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
    function (callback) {
      req.prevTaskIds.forEach(function (prevTaskId) {
        TaskFollowModel
          .create({
            task_id: req.task.id,
            prev_task_id: prevTaskId,
            create_time: moment().unix()
          })
          .then(function () {
              callback(null);
          });
      });
    }
  ], function () {
    res.json({id: req.task.id});
  });
});

// 删除任务
router.delete('/:id', checkTaskId);
router.delete('/:id', function (req, res) {
  req.task
    .update({
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
  req.task
    .drag(req.body.task_status_id)
    .then(function (task) {
      res.json({id: task.id});
    });
  next();
});
router.put('/:id/status', function (req) { // 前置任务完成则推送99U
  // 判断是否开发完成
  if (!TaskStatusModel.isDragToComplete(req.body.task_status_id)) {
    return;
  }

  // send msg
  TaskService.sendPreTaskMsg(req.task);
  TaskService.sendConcernedMsg(req.task);
  TaskService.sendLeaderMsg(req.task);
});

// 任务deadline信息通知
router.get('/deadline', function (req, res) {
  TaskService.sendDeadlineMsg(function (err, results) {
    res.json({msg: '通知成功'});
  });
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
      RouterService.json(err, res);
    });
});

// 取消关注
router.post('/:id/unconcerned', checkTaskId);
router.post('/:id/unconcerned', checkUserId);
router.post('/:id/unconcerned', function (req, res) {
  TaskConcernedModel
    .find({
      where: {task_id: req.task.id, user_id: req.user.id}
    })
    .then(function (taskConcerned) {
      if (taskConcerned) {
        taskConcerned
          .destroy()
          .then(function () {
            res.json({msg: '取消成功'});
          });
      }
    });
});

// 上传
router.post('/upload', function (req, res) {
  CsvService.upload(req.files.csv, function (err, csv) {
    if (err) {
      res.status(400);
      res.json(err);
    } else {
      res.json({id: csv.id});
    }
  });
});

// 上传结果
router.get('/upload/show/:id', function (req, res, next) {
  CsvModel
    .findById(req.params.id)
    .then(function (csv) {
      if (csv === null) {
        res.status(400);
        res.json({msg: '不存在的导入'});
      } else {
        req.csv = csv;
        next();
      }
    });
});
router.get('/upload/show/:id', function (req, res) {
  setTimeout(function () {
    res.sendFile(logger.filename('csv', req.csv.id));
  }, 5000);
});

function checkUserId(req, res, next) {
  UserModel
    .findById(req.param('user_id'))
    .then(function (user) {
      if (user === null) {
        res.status(404);
        res.json({msg: '用户不存在'});
      } else {
        req.user = user;
        next();
      }
    });
}
function checkTaskStausId(req, res, next) {
  TaskStatusModel
    .findById(req.body.task_status_id)
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
    .findById(req.iteration.version_id)
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
    .findById(req.param('story_id'))
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
    .findById(req.param('iteration_id'))
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
    .findById(req.params.id)
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
