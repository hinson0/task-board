# task-board
this is a project for task board in scrum.now i code it to pc browser powered by express web framework

on task board:
- we use task board to show the process of a project
- tasks and user stories are tracked on it,there are three columns,such as 'ToDdo','Doing','Doned'
- there are well defined roles for a scrum master and a product owner


this is only server codes,and the pcweb codes are [here](https://github.com/hinson0/task-board-pcweb "here")

u can take a look at the effect through this [website](http://kanban.ishuwo.com "website")

the version of node is v0.12 or larger,because of i use some es6 features in codes

# Start #
first u need to configure globa.js file in config floder, as follow:

```

// global config
var config = new Map();

// mysql
config.set('mysql', {
  host: '127.0.0.1',
  port: 3306,
  user: '', // input user
  password: '', // input password
  database: '' // input database
});

// redis
config.set('redis', {
  host: '127.0.0.1',
  port: 6379
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

```


u need to input something on mysql options, include user,password,database

and also, your server should be installed redis service, it used to save session

u can rename local.example.js file to local.js.That way u can easily switch your configuration environment.u can use loca.js file in dev environment,and use global.js file in production environment


```

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

```