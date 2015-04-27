var async = require('async');

var TaskStatusModel2 = require('../model/task_status_model');
var TaskFollow2 = require('../model/task_follow_model');
var TaskModel2 = require('../model/task_model');
var UserModel2 = require('../model/user_model');
var TaskConcerned = require('../model/task_concerned_model');

var Msg91U = require('../library/msg91u');

var TaskService = {
  send91umsg: function(prevTask) { // 前置任务完成则推送99U
    // 查找关联
    var findTaskFollows = function(callback) {
      TaskFollow2
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
        TaskModel2
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
            UserModel2
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
      TaskConcerned
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
        UserModel2
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
  }
};

module.exports = TaskService;