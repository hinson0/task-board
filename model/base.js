// 依赖
var config = require('../config/db');
var Sequelize = require('sequelize');

// 导出
var base = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'mysql',
  define: {
    engine: 'innodb',
    freezeTableName: true,
    timestamps: false,
  }
});

module.exports = base;