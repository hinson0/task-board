var express = require('express');
var router = express.Router();
var UserService = require('../service/user_service');

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

module.exports = router;

