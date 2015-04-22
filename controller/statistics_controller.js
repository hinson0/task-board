var express = require('express');
var router = express.Router();

var TaskModel = require('../model/task');
var VersionModel = require('../model/version');
var IterationModel = require('../model/iteration');
var Helper = require('../library/helper');

var StatisticsService = require('../service/statistics_service');

router.get('/hours', checkVersionId);
router.get('/hours', function(req, res) {
    TaskModel.getHoursByVersionId(req.query.version_id, function(tasks) {
        res.json(tasks);
    })
});

router.get('/story', function(req, res, next) {
    if (isGetByVersionId(req)) {
        checkVersionId(req, res, next);
    } else if (isGetByIterationId(req)) {
        checkIterationId(req, res, next);
    } else {
        checkVersionId(req, res, next);
    }
});
router.get('/story', function(req, res, next) {
    if (isGetByVersionId(req)) {
        StatisticsService.storyByVersionId(req.query.version_id, function(tasks) {
            res.json(tasks);
        });
    } else {
        next();
    }
}, function(req, res, next) {
    if (isGetByIterationId(req)) {
        StatisticsService.storyByIterationId(req.param('iteration_id'), function(result) {
            res.json(result);
        });
    } else {
        next();
    }
}, function(req, res) {
    StatisticsService.storyRecentlyIteration(req.query.version_id, function(result) {
        res.json(result);
    });
});

router.get('/bdc', function(req, res, next) {
    if (req.query.version_id) {
        checkVersionId(req, res, next);
    } else if (req.query.iteration_id) {
        checkIterationId(req, res, next);
    } else {
        res.status(404);
        res.json({msg: '非法参数'});
    }
});
router.get('/bdc', function(req, res, next) {
    if (req.query.version_id) {
        StatisticsService.dbcByVersionId(req.version.id, function(result) {
            res.json(result);
        });
    } else {
        next();
    }
}, function(req, res) {
    if (req.query.iteration_id) {
        StatisticsService.dbcByIterationId(req.iteration.id, function(result) {
            res.json(result);
        })
    }
});

function checkVersionId(req, res, next) {
    VersionModel.getById(req.query.version_id, function(versionInfo) {
        if (Helper.isEmptyObj(versionInfo)) {
            res.status(404);
            res.json({msg: '版本记录不存在'});
        } else {
            req.version = versionInfo;
            next();
        }
    });
}
function checkIterationId(req, res, next) {
    IterationModel.getById(req.query.iteration_id, function(iteration) {
        if (Helper.isEmptyObj(iteration)) {
            res.status(404);
            res.json({msg: '迭代记录不存在'});
        } else {
            req.iteration = iteration;
            next();
        }
    });
}
function isGetByVersionId(req) {
    if (req.query.version_id && !req.query.recently) {
        return true;
    }
    return false;
}
function isGetByIterationId(req) {
    return req.query.iteration_id ? true : false;
}

module.exports = router;