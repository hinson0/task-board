var express = require('express');
var router = express.Router();
var async = require('async');
var redis = require('redis');
var moment = require('moment');

var Redis = require('../library/redis');
var UserService = require('../service/user_service');
var UserModel = require('../model/user_model');
var Msg91u = require('../library/msg91u');

// 登陆
router.post('/login2', checkLogin);
router.post('/login2', function (req, res) {
  async.waterfall([
    function (cb) { // 检查员工号+密码
      UserModel
        .find({
          where: {
            worker_num: req.body.name
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
            mobile: req.body.name
          }
        })
        .then(function (user) {
          cb(null, user);
        });
    },
  ], function (err, user) {
    if (user === null) {
      res.status(403);
      res.json({msg: '用户不存在'});
      return;
    }

    if (!user.isPasswordValid(req.body.password)) {
      res.status(403);
      res.json({msg: '密码错误'});
      return;
    }

    req.session.user_id = user.id;
    req.session.user = user;
    res.json({id: user.id});
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
router.post('/reg_step1', checkReg);
router.post('/reg_step1', checkWorkerNum);
router.post('/reg_step1', function (req, res) {
  // 发送91u信息
  var msg91u = new Msg91u(req.body.worker_num);
  var number = moment().format('x').substr(-6);
  var msg = '您正在注册看板工具，校验码：' + number;
  msg91u.send(msg);

  // 将key保存
  var redisClient = Redis.create();
  var key = getKey(req.body.worker_num);
  redisClient.hset(key, 'is_used', 0);
  redisClient.hset(key, 'worker_num', req.body.worker_num);
  redisClient.hset(key, 'password', req.body.password);
  redisClient.hset(key, 'num', number);
  redisClient.expire(key, 60);

  res.json({msg: '请在91u中查收验证码'});
});

// 用户注册 步骤2
router.post('/reg_step2', checkKey);
router.post('/reg_step2', function (req, res) {
  var salt = UserModel.generateSalt();
  var password = UserModel.generatePassword(salt, req.password);

  UserModel
    .create({
      worker_num: req.body.worker_num,
      password: password,
      salt: salt,
      create_time: moment().unix()
    })
    .then(function (user) {
      if (user) {
        res.json({id: user.id});
      } else {
        res.status(500);
        res.json({msg: '注册失败'});
      }
    });
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
function checkReg(req, res, next) {
  // name
  req.checkBody('worker_num', '请提供91U员工号').notEmpty();

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
  var redisClient = Redis.create();
  var key = getKey(req.body.worker_num);
    redisClient.hgetall(key, function (err, obj) {
    if (obj === null) {
      res.status(403);
      res.json({msg: '请核实验证码'});
      return;
    }
    console.log('验证码' + req.body.number + '对应的值为' + JSON.stringify(obj));
    if (parseInt(obj.is_used)) {
      res.status(403);
      res.json({msg: '验证码已使用'});
      return;
    }
    if (parseInt(obj.num) !== parseInt(req.body.number)) {
      res.status(403);
      res.json({msg: '验证码错误'});
      return;
    }
    req.password = obj.password;
    redisClient.hset(key, 'is_used', 1);
    next();
  });
}
function getKey(number) { // redis中key
  return 'kb_login_' + number;
}

module.exports = router;

