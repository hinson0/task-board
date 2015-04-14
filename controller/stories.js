var express = require('express');
var router = express.Router();

var InterationModel = require('../model/iteration');
var UserModel = require('../model/user');
var StoryModel = require('../model/story');

router.post('/', checkInterationId);
router.post('/', checkLeader);
router.post('/', checkTitle);
router.post('/', function(req, res) {
    var story = new StoryModel(req.body);
    story.save(function(id) {
        res.json({id: id});
    });
});

function checkInterationId(req, res, next) { // 迭代ID记录是否存在
    InterationModel.getById(req.body.iteration_id, function(interationInfo) {
        if (!interationInfo.id) {
            res.status(404);
            res.json({'msg': '迭代不存在'});
        } else {
            req.interationInfo = interationInfo;
            next();
        }
    });
}
function checkLeader(req, res, next) { // 校验故事负责人是否存在
    UserModel.getById(req.body.leader, function(userInfo) {
        if (!userInfo.id) {
            res.status(404);
            res.json({'msg': '用户不存在'});
            return;
        } else {
            req.userInfo = userInfo;
            next();
        }
    });
}
function checkTitle(req, res, next) { // title是否已经存在
    StoryModel.getByUnixIt(req.body.iteration_id, req.body.title, function(storyTitle) {
        if (storyTitle.id) {
            res.status(404);
            res.json({msg: '故事title存在'});
        } else {
            next();
        }
    });
}

module.exports = router;