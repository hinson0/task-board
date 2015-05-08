var Sequelize = require('sequelize');
var base = require('./base');
var moment = require('moment');

var Msg91uModel = module.exports = base.define('msg91u', {
  content: {
    type: Sequelize.STRING
  },
  receiver: {
    type: Sequelize.INTEGER
  },
  is_readed: {
    type: Sequelize.INTEGER
  },
  create_time: {
    type: Sequelize.INTEGER,
    defaultValue: moment().unix()
  },
  is_deleted: {
    type: Sequelize.INTEGER
  }
});
