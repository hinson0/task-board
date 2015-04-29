var express = require('express');
var router = express.Router();

var UserService = require('../service/user_service');
var UserModel = require('../model/user_model');

// 登陆
router.post('/login', function (req, res) {
  // 请求xxjia.cn的登陆地址
  UserService.loginFromXxjia(req.body, function (err, loginInfo) {
    // 异常
    if (err) {
      res.status(404);
      res.json(err);
      return;
    }

    // 是否正常请求
    if (!loginInfo.uid) {
      res.status(404);
      res.json({msg: loginInfo.error.msg});
      return;
    }

    UserService.saveWhenLoginFromXxjia(loginInfo, req.body.account, function (user) {
      res.json({id: user.id});
    });
  });
});

// 登出
router.post('/logout', function () {

});

// 列表
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
router.get('/show/:id', function (req, res, next) {
  UserModel
    .find(req.params.id)
    .then(function (user) {
      if (user === null) {
        res.status(400);
        res.json({msg: '用户不存在'});
      } else {
        res.json(user);
      }
    });
});

module.exports = router;

