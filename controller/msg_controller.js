var express = require('express');
var router = express.Router();

var Msg91uModel = require('../model/msg91u_model');
var UserModel = require('../model/user_model');

router.get('/', checkUserId);
router.get('/', function (req, res) {
  Msg91uModel
    .findAll({
      where: {receiver: req.query.user_id},
      offset: req.query.offset || 0,
      limit: req.query.size || 10,
      order: 'id DESC'
    })
    .then(function (msgs) {
      res.json(msgs);
    });
});

function checkUserId(req, res, next) {
  UserModel
    .find(req.query.user_id)
    .then(function (user) {
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(400);
        res.json({msg: '用户不存在'});
      }
    });
}

module.exports = router;