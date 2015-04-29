// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var ProjectModel = base.define('project', {
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

ProjectModel.statusOnline = 0;
ProjectModel.statusDeleted = 99;

module.exports = ProjectModel;