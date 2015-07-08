var express = require('express');
var router = express.Router();
var async = require('async');

router.get('/', function (req, res) {
  async.series([
    function (cb) {
      console.log(1);
      cb(null);
    },
    function (cb) {
      console.log(2);
      cb(null);
    }
  ], function (err, result) {
    if (err) {
      res.status(400);
      res.json({msg: 'err message'});
    } else {
      res.json(result);
    }
  });
});

router.get('/redis', function (req, res) {
  var redis = require('redis');
  var config = require('../config/redis');
  var redisClient = redis.createClient(config.port, config.host);

  // eg1
  redisClient.hmset('hash', {
    hello: 'world',
    hello2: 'world2',
    hello3: 'world3'
  });

  redisClient.hgetall('hash2', function (err, obj) {
    console.log(err);
    console.log(obj);
  });

   res.end('redis');
});

router.get('/pro', function (req, res) {
  console.log(req.session);
  res.json({msg: '产品页面'});
});

router.get('/sess', function (req, res) {

  //req.session.user_id = req.query.user_id;
  //req.session.expireTime = 200;
  //req.session.loginTime = 100;
  //
  console.log(req.session);
  //console.log(req.session.id);

  res.json({msg: '登陆成功'});

  //if (req.session.expireTime > 150) {
  //  res.status(403);
  //  res.json({msg: '请重新登陆'});
  //}

  //var expireTime = req.session.cookie.or

  //var store = new MongoStore(require('../config/mongodb'));
  //req.session.userId = 222;
  //req.session.user = {hello: 'world'};
  //req.session.loginTime = {hello: 'world'};
  //req.session.expireTime = {hello: 'world'};
  //store.set(req.session.id, req.session);
  //
  //store.get(req.session.id, function (err, sess) {
  //  var expireTime = sess.cookie
  //  if (1) { // 过期
  //
  //  }
  //
  //
  //  console.log(sess);
  //  res.json(sess);
  //});


  //var sess = req.session;
  //if (sess.views) {
  //  sess.views++
  //  res.setHeader('Content-Type', 'text/html')
  //  res.write('<p>views: ' + sess.views + '</p>')
  //  res.write('<p>expires in: ' + (sess.cookie.maxAge / 1000) + 's</p>')
  //  res.end()
  //} else {
  //  sess.views = 1
  //  res.end('welcome to the session demo. refresh!')
  //}
});

router.get('/promise', function (req, res) {
  // 获取任务ID=100，然后更新字段desc='我要测试promise'，然后再读取ID=101，显示给用户
  // SELECT * FROM task WHERE id = 100
  // UPDATE task SET desc = '我要测试promise' WHERE id = 100
  // SELECT * FROM task WHERE id = 101;

  var TaskModel = require('../model/task_model');
  TaskModel
    .find(100)
    .then(function (task) {
        task
          .update({
            desc: '我要测试promise'
          })
          .then(function () {

          });
    });

});

module.exports = router;