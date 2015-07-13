// 依赖
var http = require('http');
var moment = require('moment');
var async = require('async');
var uid = require('uid-safe').sync;

var redis = require('../library/redis').create();

// UserService
var UserService = {
  setSession: function (user, req) {
    var sid = uid(24);
    var expired = moment().unix() + 7 * 24 * 60 * 60;
    var session = {
      id: sid,
      expired: expired,
      user: user.get({plain: true}),
      user_id: user.id
    };
    var stringify = JSON.stringify(session);
    redis.set(sid, stringify);
    req.session = session;
    req.user = user;
    console.log(session);
  },
  destroySession: function (req) {
    redis.expire(req.session.id, 0);
  },
  checkSession: function (req, res, next) {
    async.waterfall([
      // get session id
      function (cb) {
        var sid = req.query.sid;
        if (!sid) {
          cb('请登录后访问');
        } else {
          cb(null, sid);
        }
      },
      // get session
      function (sid, cb) {
        redis.get(sid, function (err, session) {
          if (session) {
            cb(null, session);
          } else {
            console.log('session empty, sid ' + sid);
            cb('请登录后访问');
          }
        });
      },
      // check whether session expired or not
      function (session, cb) {
        var parsed = JSON.parse(session);
        if (parsed.expired <= moment().unix()) {
          console.log('session expired, sid ' + session.id);
          cb('请重新登录后访问');
        } else {
          cb(null, parsed);
        }
      },
    ], function (err, session) {
      if (err) {
        res.status(403);
        res.json({msg: err});
      } else {
        console.log('userid ' + session.user_id + ' session check success');
        next();
      }
    });
  },
  isMe: function (req, userId) { // 是否为自己
    var me = req.session.user_id;
    return parseInt(me) === parseInt(userId);
  }
};

module.exports = UserService;
