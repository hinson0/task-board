// if u want to use this file, u must rename this file to local.js

// local config
var config = new Map();

// mysql
config.set('mysql', {
  host: '127.0.0.1',
  port: 3306,
  user: '', // enter username
  password: '', // input password
  database: '' // input database
});

// redis
config.set('redis', {
  host: '192.168.94.26',
  port: 6380
});

module.exports = config;