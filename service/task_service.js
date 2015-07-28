var async = require('async');
var _ = require('underscore');
var logger = require('../library/logger');
var moment = require('moment');

var TaskStatusModel = require('../model/task_status_model');
var TaskFollowModel = require('../model/task_follow_model');
var TaskModel = require('../model/task_model');
var UserModel = require('../model/user_model');
var TaskConcernedModel = require('../model/task_concerned_model');
var StoryModel = require('../model/story_model');
var IterationModel = require('../model/iteration_model');
var Msg91uModel = require('../model/msg91u_model');

var Msg91U = require('../library/msg91u');
var Mail = require('../library/mail');

var TaskService = {
  sendPreTaskMsg: function(prevTask) { // send msg if you are the author of prepositive task
    // find task follows
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

    // find tasks
    var findTasks = function(taskFollows, callback) {
      var tasks = [];
      taskFollows.forEach(function (taskFollow) {
        TaskModel
          .findById(taskFollow.task_id)
          .then(function(task) {
            if (task !== null) {
              tasks.push(task);
            }
          });
      });
      callback(null, tasks);
    };
    
    // find users
    var findUsers = function(tasks, callback) {
      prevTask
        .getUser()
        .then(function(prevTaskUser) {
          tasks.forEach(function(task) {
            UserModel
              .findById(task.user_id)
              .then(function(user) {
                var mail = new Mail(user.email);
                var msg = 'Prepositive task [' + prevTask.desc + '] has been completed by ' + prevTaskUser.name + '.Now you can start task[' + task.desc + '].';
                mail.send(msg);
              });
          });
        });
      callback(null);
    };
    
    async.waterfall([findTaskFollows, findTasks, findUsers]);
  },
  sendConcernedMsg: function (task) { // send msg if you focus on this task
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
          .findById(taskConcerned.user_id)
          .then(function (user) {
            var mail = new Mail(user.email);
            var msg = 'Task [' + task.desc + '] that you foucs on has been completed by ' + taskUser.name;
            mail.send(msg);
          });
        cb(null);
      });
      callback(null);
    };
    
    async.waterfall([findTaskUser, findTaskConcerned, findUsers]);
  },
  sendLeaderMsg: function (task) { // send msg if you are a leader of this task
    async.waterfall([
      // user
      function (callback) {
        UserModel
          .findById(task.user_id)
          .then(function (user) {
            callback(null, user);
          });
      },
      // story
      function (taskUser, callback) {
        StoryModel
          .findById(task.story_id)
          .then(function (story) {
            callback(null, taskUser, story);
          });
      },
      // find leader
      function (taskUser, story, callback) {
        UserModel
          .findById(story.leader)
          .then(function (user) {
            callback(null, taskUser, user);
          });
      },
      // send msg
      function (taskUser, user, callback) {
        var mail = new Mail(user.email);
        var msg = 'Task [' + task.desc + '] has been completed by ' + taskUser.name + '.You will receive this msg because you are a leader of this task';
        mail.send(msg);

        callback(null);
      }
    ], function (err, result) {
      // do nothing
      console.log(err)
    });
  },
  sendDeadlineMsg: function (callback) { // send msg if today is the deadline to complete
    var year = moment().get('year');
    var month = moment().get('month') + 1;
    var date = moment().get('date');
    var todayStart = moment(year + '-' + month + '-' + date, 'YYYY-MM-DD');
    var todayEnd = moment(todayStart).add(1, 'days');

    async.waterfall([
      // find tasks
      function (callback) {
        TaskModel
          .findAll({
            where: {
              deadline: {
                $between: [todayStart.unix(), todayEnd.unix()]
              },
              status: TaskModel.statusOnline
            }
          })
          .then(function (tasks) {
            callback(null, tasks);
          });
      },
      // find users
      function (tasks, callback) {
        async.each(tasks, function (task, cb) {
          UserModel
            .findById(task.user_id)
            .then(function (user) {
              var mail = new Mail(user.email);
              var msg = 'Please complete the task[' + task.desc + '], because today is the deadline';
              mail.send(msg);
            });
          cb(null);
        }, function (err) {
          callback(null);
        });
      }
    ], function (err, results) {
      callback(err, results);
    });
  },
  sendMsgWhenAuthorChanged: function (task, currentUser, operatorUser) { // send msg if the anthor of a task is changed
    async.waterfall([
      // find original anthor
      function (cb) {
        UserModel
          .findById(task.user_id)
          .then(function (orginalUser) {
            cb(null, orginalUser);
          });
      }
    ], function (err, originalUser) {
      console.log('task:' + task.desc + ',original author：' + originalUser.name + ', current author:' + currentUser.name + ', operator:' + operatorUser.name);

      var originalUserMail = new Mail(originalUser.email);
      var originalMsg = 'Your task[' + task.desc + '] is assigned to ' + currentUser.name;
      originalUserMail.send(originalMsg);

      var currentUserMail = new Mail(currentUser.email);;
      var currentMsg = 'The task[' + task.desc + '] belonged to ' + originalUser.name + ' has assigned to you operated by ' + operatorUser.name;
      currentUserMail.send(currentMsg);
    });
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
            logger.log('csv', '任务 - [' + task.desc + ']导入成功，ID=' + task.id, csvId);
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
