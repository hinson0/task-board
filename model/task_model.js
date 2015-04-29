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
  end_time: {
    type: Sequelize.INTEGER
  },
  create_time: {
    type: Sequelize.INTEGER,
    defaultValue: moment().unix()
  }
}, {
  instanceMethods: {
    drag: function(status_id) { // 拉动任务
      // 新建操作记录
      TaskHistoryModel.gen(this.id, this.status_id, status_id, this.user_id);
      
      // 修改
      status_id = parseInt(status_id);
      if (status_id === TaskStatusModel.DEVING) { // 拉动到开发中
        this.start_time = moment().unix();
      } else if (status_id === TaskStatusModel.COMPLETE) { // 拉动到已完成
        this.end_time = moment().unix();
      } else {
        // do nothing
      }
      this.status_id = status_id;
      return this.save();
    },
    isCompleted: function () { // 是否完成
      return this.status_id === TaskStatusModel.COMPLETE;
    }
  }
});

TaskModel.statusOnline = 0;
TaskModel.statusOffline = 99;

// 关系
var UserModel = require('./user_model');
var TaskStatusModel = require('./task_status_model');
var TaskFollowModel = require('./task_follow_model');
var TaskHistoryModel = require('./task_history_model');
var IterationModel = require('./iteration_model');
var StoryModel = require('./story_model');
var ProjectModel = require('./project_model');
var VersionModel = require('./version_model');

TaskModel.belongsTo(UserModel, {foreignKey: 'user_id'});
TaskModel.belongsTo(TaskStatusModel, {foreignKey: 'status_id'});
TaskModel.hasMany(TaskFollowModel, {foreignKey: 'task_id'});
TaskModel.hasMany(TaskHistoryModel, {foreignKey: 'task_id'});
TaskModel.belongsTo(IterationModel, {foreignKey: 'iteration_id'});
TaskModel.belongsTo(StoryModel, {foreignKey: 'story_id'});
TaskModel.belongsTo(ProjectModel, {foreignKey: 'project_id'});
TaskModel.belongsTo(VersionModel, {foreignKey: 'version_id'});

module.exports = TaskModel;