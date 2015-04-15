// 依赖
var Sequelize = require('sequelize');
var moment = require('moment');
var base = require('./base');

// 类
var ProjectModel = base.define('project', {
  leader: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
});

module.exports = ProjectModel;