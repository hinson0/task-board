var Sequelize = require('sequelize');
var base = require('./base');

var UserModel = base.define('user', {
  xxjia_user_id: {
    type: Sequelize.INTEGER,
  },
  mobile: {
    type: Sequelize.STRING,
  },
  worker_num: {
    type: Sequelize.INTEGER,
  },
  name: {
    type: Sequelize.STRING,
  },
  email: {
    type: Sequelize.STRING,
  },
  create_time: {
    type: Sequelize.INTEGER,
  },
});

module.exports = UserModel;