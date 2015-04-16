var Sequelize = require('sequelize');
var base = require('./base');

var TaskStausModel = base.define('task_status', {
  name: {
    type: Sequelize.STRING,
  },
  sort: {
    type: Sequelize.INTEGER,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
});

TaskStausModel.WAITING = 10;
TaskStausModel.DEVING = 20;
TaskStausModel.COMPLETE = 50;

module.exports = TaskStausModel;