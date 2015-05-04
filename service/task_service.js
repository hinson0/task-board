var async = require('async');
var logger = require('../library/logger');

var TaskStatusModel = require('../model/task_status_model');
var TaskFollowModel = require('../model/task_follow_model');
var TaskModel = require('../model/task_model');
var UserModel = require('../model/user_model');
var TaskConcernedModel = require('../model/task_concerned_model');
var StoryModel = require('../model/story_model');
var IterationModel = require('../model/iteration_model');

var Msg91U = require('../library/msg91u');

var TaskService = {
  send91umsg: function(prevTask) { // 前置任务完成则推送99U
    // 查找关联
    var findTaskFollows = function(callback) {
      TaskFollowModel
        .findAll({
          where: {prev_task_id: prevTask.id}
        }).then(function(taskFollows) {
          if (taskFollows) {
            callback(null, taskFollows);
          } else {
            callback(true);
          }
        });
    };

    // 查找任务
    var findTasks = function(taskFollows, callback) {
      var tasks = [];
      taskFollows.forEach(function (taskFollow) {
        TaskModel
          .find(taskFollow.task_id)
          .then(function(task) {
            if (task !== null) {
              tasks.push(task);
            }
          });
      });
      callback(null, tasks);
    };
    
    // 查找用户
    var findUsers = function(tasks, callback) {
      prevTask
        .getUser()
        .then(function(prevTaskUser) {
          tasks.forEach(function(task) {
            UserModel
              .find(task.user_id)
              .then(function(user) {
                var msg91u = new Msg91U(user.worker_num);
                var msg = '前置任务【' + prevTask.desc + '】' + prevTaskUser.name + '已完成，你可以开始【' + task.desc + '】了，加油哟';
                msg91u.send(msg);
              });
          });
        });
      callback(null);
    };
    
    async.waterfall([findTaskFollows, findTasks, findUsers]);
  },
  sendConcernedMsg: function (task) {
    var findTaskUser = function (callback) {
      task
        .getUser()
        .then(function (user) {
          callback(null, user);
        });
    };
    
    var findTaskConcerned = function (taskUser, callback) {
      TaskConcernedModel
        .findAll({
          where: {
            task_id: task.id
          }
        })
        .then(function (taskConcerneds) {
          callback(null, taskConcerneds, taskUser);
        });
    };
    
    var findUsers = function (TaskConcerneds, taskUser, callback) {
      async.each(TaskConcerneds, function (taskConcerned, cb) {
        UserModel
          .find(taskConcerned.user_id)
          .then(function (user) {
            var msg91u = new Msg91U(user.worker_num);
            var msg = '您关注的任务【' + task.desc + '】' + taskUser.name + '已完成';
            msg91u.send(msg);
          });
        cb(null);
      });
      callback(null);
    };
    
    async.waterfall([findTaskUser, findTaskConcerned, findUsers]);
  },
  upload: function (csvId, info, callback) {
    var props = info.split(',');
    
    logger.log('csv', '----', csvId);
    logger.log('csv', '任务 - 开始导入，信息为：', csvId);
    logger.log('csv', props.toString(), csvId);
    
    async.waterfall([
      // 故事是否存在
      function (callback) {
        StoryModel
          .find({
            where: {title: props[4]}
          })
          .then(function (story) {
            if (story === null) {
              callback('任务 - 项目[' + props[4] + ']不存在，忽略');
            } else {
              callback(null, story);
            }
          });
      },
      // 迭代是否存在
      function (story, callback) {
        IterationModel
          .find({
            where: {name: props[0], version_id: story.version_id}
          })
          .then(function (iteration) {
            if (iteration === null) {
              callback('任务 - 迭代[' + props[0] + ']不存在，忽略');
            } else {
              callback(null, story, iteration);
            }
          });
      },
      // 开发者是否存在
      function (story, iteration, callback) {
        UserModel
          .find({
            where: {name: props[2]}
          })
          .then(function (user) {
            if (user === null) {
              callback('任务 - 用户[' + props[2] + ']不存在，忽略');
            } else {
              callback(null, user, story, iteration);
            }
          });
      },
      // 导入
      function (user, story, iteration, callback) {
        TaskModel
          .create({
            project_id: story.project_id,
            version_id: story.version_id,
            iteration_id: iteration.id,
            story_id: story.id,
            user_id: user.id,
            priority: 5,
            estimated_time: props[3],
            status_id: TaskStatusModel.WAITING,
            desc: props[1],
            create_time: 1
          })
          .then(function (task) {
            logger.log('csv', '任务 - 故事[' + task.desc + ']导入成功，ID=' + task.id, csvId);
            callback(null);
          })
          .catch(function (err) {
            callback(err);
          });
      }
    ], function (err, result) {
      if (err) {
        logger.log('csv', err, csvId);
      }
      callback(err, result);
    });
    
  }
};

module.exports = TaskService;