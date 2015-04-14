var config = require('../config/db');
var Sequelize = require('sequelize');
var sequelize = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'mysql'
});

module.exports = sequelize;