var express = require('express');
var router = express.Router();
var async = require('async');
var redis = require('redis');
var moment = require('moment');

var UserService = require('../service/user_service');
var UserModel = require('../model/user_model');
var Msg91u = require('../library/msg91u');

// 登陆
router.post('/login', function (req, res) {
  // 请求xxjia.cn的登陆地址
  UserService.loginFromXxjia(req.body, function (err, loginInfo) {
    // 异常
    if (err) {
      res.status(400);
      res.json(err);
      return;
    }

    // 是否正常请求
    if (!loginInfo.uid) {
      res.status(400);
      res.json({msg: loginInfo.error.msg});
      return;
    }

    UserService.saveWhenLoginFromXxjia(loginInfo, req.body.account, function (user) {
      res.json({id: user.id});
    });
  });
});

// 登陆
router.post('/login2', checkLogin);
router.post('/login2', function (req, res) {
  async.waterfall([
    function (cb) { // 检查员工号+密码
      UserModel
        .find({
          where: {
            worker_num: req.body.name,
            password: req.body.password
          }
        })
        .then(function (user) {
          cb(null, user);
        });
    },
    function (user, cb) { // 检查手机号+密码
      if (user) { // 已经找到，则直接跳过手机号查找
        return cb(null, user);
      }
      UserModel
        .find({
          where: {
            mobile: req.body.name,
            password: req.body.password
          }
        })
        .then(function (user) {
          cb(null, user);
        });
    },
  ], function (err, user) {
    if (user) {
      req.session.user_id = user.id;
      req.session.user = user;
      res.json({id: user.id});
    } else {
      res.status(400);
      res.json({msg: '用户不存在/密码错误'});
    }
  });
});

// 登出
router.post('/logout', function () {

});

// 列表
router.get('/list', UserService.checkSession);
router.get('/list', function (req, res, next) {
  UserModel
    .findAll({
      offset: req.query.offset || 0,
      limit: req.query.size || 10
    })
    .then(function (users) {
      res.json(users);
    });
});

// 详情
router.get('/show/:id', UserService.checkSession);
router.get('/show/:id', checkUserId);
router.get('/show/:id', function (req, res, next) {
  res.json(req.user);
});

// 修改
router.put('/modi/:id', UserService.checkSession);
router.put('/modi/:id', checkUserId);
router.put('/modi/:id', function (req, res) {
  req.user
    .update(req.body)
    .then(function (user) {
      res.json(user);
    });
});

// 用户删除
router.delete('/del/:id', UserService.checkSession);
router.delete('/del/:id', checkUserId);
router.delete('/del/:id', function (req, res) {
  req.user.destroy();
  res.json({msg: '操作成功'});
});

// 用户注册 步骤1
router.post('/reg_step1', checkWorkerNum);
router.post('/reg_step1', function (req, res) {
  // 发送91u信息
  var msg91u = new Msg91u(req.body.worker_num);
  var number = moment().format('x').substr(-6);
  var msg = '您正在注册看板工具，校验码：' + number;
  msg91u.send(msg);

  // 将key保存
  var config = require('../config/redis');
  var redisClient = redis.createClient(config.port, config.host);
  var key = 'kb_login_' + req.body.worker_num;
  redisClient.hset(key, 'is_used', 0);
  redisClient.hset(key, 'worker_num', req.body.worker_num);
  redisClient.hset(key, 'num', number);

  res.json({msg: '请在91u中查收验证码'});
});

// 用户注册 步骤2
router.post('/reg_step2', checkKey);
router.post('/reg_step2', function (req, res, next) {
  
});

function checkUserId(req, res, next) {
  UserModel
    .find(req.params.id)
    .then(function (user) {
      if (user === null) {
        res.status(400);
        res.json({msg: '用户不存在'});
      } else {
        req.user = user;
        next();
      }
    });
}
function checkWorkerNum(req, res, next) {
  UserModel
    .find({
      where: {
        worker_num: req.body.worker_num
      }
    })
    .then(function (user) {
      if (user) {
        res.status(400);
        res.json({msg: '工号已经注册'});
      } else {
        next();
      }
    });
}
function checkLogin(req, res, next) { // 检查登陆状况
  // name
  req.checkBody('name', '请提供用户名').notEmpty();

  // password
  req.checkBody('password', '请提供密码').notEmpty();

  var errors = req.validationErrors(true);

  if (errors) {
    res.status(400);
    res.json(errors);
  } else {
    next();
  }
}
function checkKey(req, res, next) { // 校验验证码

}

module.exports = router;

