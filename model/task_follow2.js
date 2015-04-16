var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

var TaskFollowModel = base.define('task_follow', {
  task_id: {
    type: Sequelize.INTEGER,
  },
  prev_task_id: {
    type: Sequelize.INTEGER,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
});

module.exports = TaskFollowModel;