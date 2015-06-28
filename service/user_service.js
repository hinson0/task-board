// 依赖
var http = require('http');
var xxjia = require('../config/xxjia');
var UserModel2 = require('../model/user_model');

// UserService
var User = module.exports = {
  checkSession: function (req, res, next) {
    // session的用户id是否存在
    if (!req.session.user_id) {
      res.status(403);
      res.json({msg: '请登陆后访问'});
    } else {
      req.user = req.session.user;
      console.log('用户' + req.user.id + '登陆');
      next();
    }
  }
};