var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

var TaskHistoryModel = base.define('task_history', {
  task_id: {
    type: Sequelize.INTEGER
  },
  current: {
    type: Sequelize.INTEGER
  },
  next: {
    type: Sequelize.INTEGER
  },
  user_id: {
    type: Sequelize.INTEGER
  },
  create_time: {
    type: Sequelize.INTEGER
  }
}, {
  classMethods: {
    gen: function (taskId, current, next, userId) {
      TaskHistoryModel
        .build({
          task_id: taskId,
          current: current,
          next: next,
          user_id: userId,
          create_time: moment().unix(),
        })
        .save()
        .catch(function (err) {
          console.log('error msg - ', err.errors);
        });
    }
  }
});

module.exports = TaskHistoryModel;
