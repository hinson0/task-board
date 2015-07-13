// 自定义配置
var config = new Map();

// mysql
config.set('mysql', {
  host: '127.0.0.1',
  port: 3306,
  user: 'momo_space',
  password: 'ndpassw0rd',
  database: 'hair_board_dev'
});

// redis
config.set('redis', {
  host: '192.168.94.26',
  port: 6380
});

module.exports = config;