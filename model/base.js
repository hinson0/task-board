// 依赖
var config = require('../config/global').get('mysql');
var Sequelize = require('sequelize');

// 导出
var base = new Sequelize(config.database, config.user, config.password, {
  host: config.host,
  dialect: 'mysql',
  define: {
    engine: 'innodb',
    freezeTableName: true, // 使用define中的名字
    timestamps: false, // 取消字段updateAt,createAt
  }
});

console.log('链接成功');

module.exports = base;