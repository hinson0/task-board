var db = require('../model/db');
var VersionModel = require('../model/version');
var ProjectModel = require('../model/project');
var IterationModel = require('../model/iteration');

var Iteration = {
    getListWithProject: function(condition, pagination, includeTotal, callback) {
        var sql = 'SELECT i.*, p.name AS project_name, v.name AS version_name FROM ?? AS i ' +
            'INNER JOIN ?? AS v ON v.id = i.version_id ' +
            'INNER JOIN ?? AS p ON p.id = v.project_id';

        var params = [IterationModel.tablename, VersionModel.tablename, ProjectModel.tablename];

        if (condition.versionId) {
            sql += ' WHERE version_id = ?';
            params.push(condition.versionId);
        }

        var offset = parseInt(pagination.offset, 10);
        var size = parseInt(pagination.size, 10);

        sql += ' LIMIT ?, ?';
        params.push(offset);
        params.push(size);

        var query = db.query(sql, params, function(err, results) {
            if (err) {
                console.log(err);
                return;
            }
            if (IterationModel._isIncludeTotal(includeTotal)) {
                var countSQL = 'SELECT COUNT(*) AS total FROM ?? AS i ' +
                    'INNER JOIN ?? AS v ON v.id = i.version_id ' +
                    'INNER JOIN ?? AS p ON p.id = v.project_id';
                db.query(countSQL, [IterationModel.tablename, VersionModel.tablename, ProjectModel.tablename], function(errOnTotal, resultsOnTotal) {
                    console.log(resultsOnTotal);
                    return callback({total: resultsOnTotal[0].total, list: results});
                });
            } else {
                return callback(results);
            }
        });
        console.log('sql - Iteration.getList - ', query.sql);
    }
};

module.exports = Iteration;