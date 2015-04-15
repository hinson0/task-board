// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var VersionModel = base.define('version', {
  project_id: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false,
    defaultValue: '',
    validate: {
      min: 0,
      max: 10,
    }
  },
  start_time: {
    type: Sequelize.INTEGER,
  },
  end_time: {
    type: Sequelize.INTEGER,
  },
  relaxed: {
    type: Sequelize.STRING,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
});

// 关系
var ProjectModel = require('./project2');

VersionModel.belongsTo(ProjectModel, { foreignKey: 'project_id' });

module.exports = VersionModel;