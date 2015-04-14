var express = require('express');
var router = express.Router();

var UserModel = require('../model/user');

// 列表
router.get('/', function(req, res) {
    var pagination = {
        offset: req.query.offset || 0,
        size: req.query.size || 10
    };
    UserModel.getList(null, pagination, req.param('_include_total', true), function(results) {
        res.json(results);
    });
});

router.use('/:id', checkId);

// 详情
router.get('/:id', function(req, res) {
    res.json(req.userInfo);
});

// 编辑
router.put('/:id', function(req, res) {
    UserModel.modiById(req.params.id, req.body, function() {
        res.json({id: req.params.id});
    });
});

// 删除
router.delete('/:id', function(req, res) {
    UserModel.deleteById(req.params.id, function() {
        res.json({'msg': '删除成功'});
    })
});

function checkId(req, res, next) {
    UserModel.getById(req.params.id, function(user) {
        if (!user.id) {
            res.status(404);
            res.json({'msg': '用户不存在'});
        } else {
            req.userInfo = user;
            next();
        }
    });
}

module.exports = router;

