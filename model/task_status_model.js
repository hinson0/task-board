var Sequelize = require('sequelize');
var base = require('./base');

var TaskStatusModel = base.define('task_status', {
  name: {
    type: Sequelize.STRING,
  },
  sort: {
    type: Sequelize.INTEGER,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
}, {
  classMethods: {
    isDragToComplete: function(status_id) {
      return parseInt(status_id, 10) === TaskStatusModel.COMPLETE;
    }
  },
});

TaskStatusModel.WAITING = 10;
TaskStatusModel.DEVING = 20;
TaskStatusModel.COMPLETE = 50;

module.exports = TaskStatusModel;