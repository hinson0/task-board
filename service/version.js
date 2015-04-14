var db = require('../model/db');
var VersionModel = require('../model/version');
var ProjectModel = require('../model/project');

var Version = {
    getListWithProject: function(pagination, includeTotal, callback) {
        var sql = 'SELECT v.*, p.name AS project_name FROM ?? AS v ' +
            'INNER JOIN ?? AS p ON p.id = v.project_id ' +
            'LIMIT ?, ?';

        var offset = parseInt(pagination.offset, 10);
        var size = parseInt(pagination.size, 10);

        var query = db.query(sql, [VersionModel.tablename, ProjectModel.tablename, offset, size], function(err, results) {
            if (err) {
                console.log(err);
                return;
            }
            if (VersionModel._isIncludeTotal(includeTotal)) {
                var countSql = 'SELECT COUNT(*) AS total FROM ?? AS v ' +
                    'INNER JOIN ?? AS p ON p.id = v.project_id';
                db.query(countSql, [VersionModel.tablename, ProjectModel.tablename], function(errOnTotal, resultsOnTotal) {
                    console.log(resultsOnTotal);
                    return callback({total: resultsOnTotal[0].total, list: results});
                });
            } else {
                return callback(results);
            }
        });
        console.log('sql - Version.getListWithProject - ', query.sql);
    }
};

module.exports = Version;
