# task-board
this is a project for task board in scrum.now i code it to pc browser powered by express web framework

on task board:
- we use task board to show the process of a project
- tasks and user stories are tracked on it,there are three columns,such as 'ToDo','Doing','Doned'
- there are well defined roles for a scrum master and a product owner


this is only server codes,and the pcweb codes are [here](https://github.com/hinson0/task-board-pcweb "here")

u can take a look at the effect through this [website](http://kanban.ishuwo.com "website"),user:18607946001,password:123456

the version of node is v0.12 or larger,because of i use some es6 features in codes


# Table of Contents #
- [Start](#Start)
	- [Configure](#Configure) 
	- [Deploy](#Deploy)
- [Introduction](#Introduction)
	- [Send Email](#sendemail)  
- [More](#More)

# Start

## Configure

### global config
u need to configure globa.js file in config floder, as follows:

```

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
  service: '126', // input email service, supproted list: https://github.com/andris9/nodemailer-wellknown#supported-services
  username: 'xxxx@126.com', // input your email
  password: 'xxxxx' // input password
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

u need to fill options about mysql,inculding user,password

and also your server should be installed redis service, it used to save session

### local config

u can rename local.example.js file to local.js.That way u can easily switch your coding environment.u can use loca.js file in development environment,and use global.js file in production environment


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

// mongodb
// ...

module.exports = config;

```

# Deploy

## SQL
u can get sql file in config floder

## Initinal
1. run 'npm install' at the command line in project folder.if u come from china, u can run 'cnpm install' because cnpm is faster.
2. start mysql service
3. start redis service

by the way this is only server codes.u can get pcweb codes from [here](https://github.com/hinson0/task-board-pcweb "here")


# Introduction

## Send Email
you will receive an email when triggered the following behaviors:

- when a task has been completed, and you are the author of prepositive task
- when a task has been completed, and you has focused on this task
- when a task has been completed, and you are the leader of this task
- when a task is assigned to anthor author, the orignal author and the target author are both receive an email

# More
- u can get more information from [oschina.net](http://www.oschina.net/p/task-board "oschina.net"), [cnodejs.org](https://cnodejs.org/topic/55a3b5623ecc81b621bba776 "cnodejs.org")

