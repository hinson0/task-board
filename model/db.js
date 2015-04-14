 // 依赖
var mysql = require('mysql');
var config = require('../config/db');

// 导出
var connection = module.exports = mysql.createConnection({
    host: config.host,
    user: config.user,
    password: config.password,
    database: config.database,
    port: config.port
});

connection.connect(function(err, result) {
    if (err) {
        console.log('链接失败...' + err.message);
        return;
    }   
    console.log('链接成功');
});


