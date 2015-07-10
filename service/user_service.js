// 依赖
var http = require('http');

// UserService
var UserService = {
  checkSession: function (req, res, next) {
    // session的用户id是否存在
    console.log(req.session.id);
    if (!req.session.user_id) {
      res.status(403);
      res.json({msg: '请登陆后访问'});
    } else {
      req.user = req.session.user;
      console.log('用户[' + req.user.id + ']session检查通过');
      next();
    }
  },
  isMe: function (req, userId) { // 是否为自己
    var me = req.session.user_id;
    return parseInt(me) === parseInt(userId);
  }
};

module.exports = UserService;