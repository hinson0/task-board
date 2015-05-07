// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var ProjectModel = module.exports = base.define('project', {
  leader: {
    type: Sequelize.INTEGER
  },
  status: {
   type: Sequelize.INTEGER 
  },
  name: {
    type: Sequelize.STRING
  },
  create_time: {
    type: Sequelize.INTEGER,
    defaultValue: moment().unix()
  }
});

// 状态
ProjectModel.statusOnline = 0;
ProjectModel.statusDeleted = 99;

// 关系
var VersionModel = require('./version_model');
ProjectModel.hasMany(VersionModel, {foreignKey: 'project_id'});