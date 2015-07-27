// global config
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
  host: '127.0.0.1',
  port: 6379
});

// email
// tips: don't use qq mail
config.set('email', {
  service: '126',
  username: 'xxxx@126.com',
  password: 'xxxxx'
});

// merge config from local.js
// if local.js is existed and local.js defines the configuration is used to local's, otherwise use global's
// like array_merge function in php
var fs = require('fs');
if (fs.existsSync(__dirname + '/local.js')) {
  var customer = require('./local');
  customer.forEach(function (value, key) {
    config.set(key, value);
  });
}

module.exports = config;