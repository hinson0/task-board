var express = require('express');
var router = express.Router();

var StoryModel = require('../model/story');

router.get('/get_list', function(req, res) {
    StoryModel.getListByIterationId(req.query.iteration_id, function(lists) {
        res.json(lists);
    });
});

module.exports = router;