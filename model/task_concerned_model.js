var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

var TaskConcernedModel = base.define('task_concerned', {
  task_id: {
    type: Sequelize.INTEGER
  },
  user_id: {
    type: Sequelize.INTEGER
  },
  create_time: {
    type: Sequelize.INTEGER
  }
});

module.exports = TaskConcernedModel;