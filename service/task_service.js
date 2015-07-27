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
          .findById(taskFollow.task_id)
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
              .findById(task.user_id)
              .then(function(user) {
                var msg91u = new Msg91U(user.worker_num);
                var msg = '前置任务【' + prevTask.desc + '】' + prevTaskUser.name + '已完成，你可以开始【' + task.desc + '】了，加油哟';
                Msg91uModel.create({content: msg, 'receiver': user.id});
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
          .findById(taskConcerned.user_id)
          .then(function (user) {
            console.log('user email is ' + user.email);
            var mail = new Mail(user.email);
            var msg = '您关注的任务【' + task.desc + '】' + taskUser.name + '已完成';
            mail.send(msg);
            Msg91uModel.create({content: msg, 'receiver': user.id});
          });
        cb(null);
      });
      callback(null);
    };
    
    async.waterfall([findTaskUser, findTaskConcerned, findUsers]);
  },
  sendLeaderMsg: function (task) { // 发送负责人
    async.waterfall([
      // 用户
      function (callback) {
        UserModel
          .findById(task.user_id)
          .then(function (user) {
            callback(null, user);
          });
      },
      // 故事
      function (taskUser, callback) {
        StoryModel
          .findById(task.story_id)
          .then(function (story) {
            callback(null, taskUser, story);
          });
      },
      // 负责人
      function (taskUser, story, callback) {
        UserModel
          .findById(story.leader)
          .then(function (user) {
            callback(null, taskUser, user);
          });
      },
      // 推送
      function (taskUser, user, callback) {
        var msg91u = new Msg91U(user.worker_num);
        var msg = '任务[' + task.desc + ']' + taskUser.name + '已完成。作为故事负责人，你会收到此消息';
        Msg91uModel.create({content: msg, 'receiver': user.id});
        msg91u.send(msg);
        callback(null);
      }
    ], function (err, result) {
      // do nothing
      console.log(err)
    });
  },
  sendAssociatedMsg: function (task) {
    async.waterfall([
      // 故事用户
      function (callback) {
        UserModel
          .findById(task.user_id)
          .then(function (user) {
            callback(null, taskUser, user);
          });
      },
      // 找到相关任务
      function (taskUser, callback) {
        TaskModel
          .findAll({
            where: {
              project_id: task.project_id,
              version_id: task.version_id,
              story_id: task.story_id
            }
          })
          .then(function (tasks) {
            if (tasks) {
              callback(null, taskUser, tasks);
            } else {
              callback('empty associated task');
            }
          });
      },
      // 过滤用户
      function (taskUser, tasks, callback) {
        var userIds = [];
        tasks.forEach(function (task) {
          if (_.indexOf(userIds, task.user_id) !== -1) {
            return;
          }
          userIds.push(task.user_id);
        });
        callback(null, taskUser, userIds);
      },
      // 发送
      function (taskUser, userIds, callback) {
        async.each(userIds, function (userId) {
          UserModel
            .findById(userId)
            .then(function (user) {
              var msg91u = new Msg91U(user.worker_num);
              var msg = '任务[' + task.desc + ']' + taskUser.name + '已完成。作为同一故事下的相关人员，你会收到此消息';
              Msg91uModel.create({content: msg, 'receiver': user.id});
              msg91u.send(msg);
            });
          callback(null);
        }, function (err) {
          callback(null);
        });
      }
    ], function (err, result) {
      if (err) {
        logger.log('91umsg', err);
      }
    });
  },
  sendDeadlineMsg: function (callback) {
    var year = moment().get('year');
    var month = moment().get('month') + 1;
    var date = moment().get('date');
    var todayStart = moment(year + '-' + month + '-' + date, 'YYYY-MM-DD');
    var todayEnd = moment(todayStart).add(1, 'days');

    async.waterfall([
      // 获取任务
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
      // 获取用户
      function (tasks, callback) {
        async.each(tasks, function (task, cb) {
          UserModel
            .findById(task.user_id)
            .then(function (user) {
              var msg91u = new Msg91U(user.worker_num);
              var msg = '任务[' + task.desc + ']，今天是截止到期，请及时完成。';
              msg91u.send(msg);
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
  sendGenTaskMsg: function (taskDesc, user) { // 新建一条任务时，发送91u信息
    console.log('--- 新建任务，发送91u信息 ---');
    console.log('任务:' + taskDesc + ',人物：' + user.name);

    var msg91u = new Msg91U(user.worker_num);
    var msg = '有一条任务[' + taskDesc + ']落到了你的口袋，请查收';
    msg91u.send(msg);
  },
  sendUpdateTaskMsg: function (task, destUser, operatorUser) {
    console.log('--- 更新任务，发送91u信息 ---');

    async.waterfall([
      // 获取原先的用户
      function (cb) {
        UserModel
          .findById(task.user_id)
          .then(function (srcUser) {
            cb(null, srcUser);
          });
      }
    ], function (err, srcUser) {
      console.log('任务:' + task.desc + ',原作者：' + srcUser.name + ',现作者:' + destUser.name + ',操作者:' + operatorUser.name);

      var originalUserMsg91u = new Msg91U(srcUser.worker_num);
      var originalMsg = '您的任务[' + task.desc + ']被指定给了' + destUser.name + '，是不是好高兴嘞';
      originalUserMsg91u.send(originalMsg);

      var currentUserMsg91u = new Msg91U(destUser.worker_num);
      var currentMsg = '天将降大任于斯人也。' + srcUser.name + '的故事[' + task.desc + ']由' + operatorUser.name + '指定给你了';
      currentUserMsg91u.send(currentMsg);
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
