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
      async.map(taskFollows, function(taskFollow, eachCb) {
        TaskModel2
          .find(taskFollow.task_id)
          .then(function(task) {
            eachCb(null, task);
          });
      }, function(err, tasks) {
        callback(null, tasks);
      });
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
              var msg = '前置任务【' + prevTask.desc + '】' + prevTaskUser.name + '已完成，你可以开始【' + task.desc + '】了，干巴爹...';
              msg91u.send(msg);
            });
          });
        });
      callback(null);
    };

    async.waterfall([findTaskFollows, findTasks, findUsers]);
  },
  sendConcernedMsg: function (task) {
//    var findTaskConcerned = function () {
//      TaskConcerned
//        .findAll({
//          where: {
//            task_id: task.id
//          }
//        })
//        .then(function (taskConcerned) {
//
//        });
//    };
//    async.waterfall([
//      
//    ]);
  }
};

module.exports = TaskService;