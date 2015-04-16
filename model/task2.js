// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var TaskModel = base.define('task', {
  project_id: {
    type: Sequelize.INTEGER,
  },
  version_id: {
    type: Sequelize.INTEGER,
  },
  iteration_id: {
    type: Sequelize.INTEGER,
  },
  story_id: {
    type: Sequelize.INTEGER,
  },
  user_id: {
    type: Sequelize.INTEGER,
  },
  desc: {
    type: Sequelize.STRING,
  },
  status: {
    type: Sequelize.INTEGER,
  },
  is_new: {
    type: Sequelize.INTEGER,
  },
  is_challenging: {
    type: Sequelize.INTEGER,
  },
  priority: {
    type: Sequelize.INTEGER,
  },
  estimated_time: {
    type: Sequelize.INTEGER,
  },
  status_id: {
    type: Sequelize.INTEGER,
  },
  start_time: {
    type: Sequelize.INTEGER,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
}, {
  instanceMethods: {
    drag: function(status_id) { // 拉动任务
      this.status_id = status_id;
      this.start_time = moment().unix();
      this.save();
    },
  },
});

TaskModel.statusOnline = 0;
TaskModel.statusOffline = 99;

// 关系
var UserModel = require('./user2');
var TaskStatusModel = require('./task_status2');
var TaskFollow = require('./task_follow2');
TaskModel.belongsTo(UserModel, {foreignKey: 'user_id'});
TaskModel.belongsTo(TaskStatusModel, {foreignKey: 'status_id'});
TaskModel.hasMany(TaskFollow, {foreignKey: 'task_id'});

module.exports = TaskModel;