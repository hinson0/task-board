var db = require('./db');
var moment = require('moment');

function Iteration(isInsert) {
    this._isInsert = (isInsert !== undefined) ? isInsert : true;
}

Iteration.prototype.save = function(props, callback) {
    if (this._isInsert) {
        var sql = 'INSERT INTO ?? SET ?';
        var params = [Iteration.tablename, props];
    } else { // 更新
        var sql = 'UPDATE ?? SET ? WHERE id = ?';
        var id = props.id;
        delete props.id;
        var params = [Iteration.tablename, props, id];
    }
    var self = this;
    var query = db.query(sql, params, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            var _id = self._isInsert ? results.insertId : id;
            return callback(_id);
        }
    });
    console.log('sql - Iteration.prototype.save - ', query.sql);
}

Iteration.tablename = 'iteration';
Iteration.getAll = function(pagination, includeTotal, callback) {
    return Iteration.getList(null, pagination, includeTotal, callback);
}
Iteration.getList = function(condition, pagination, includeTotal, callback) {
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [Iteration.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [Iteration.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(parseInt(pagination.offset, 10));
    props.push(parseInt(pagination.size, 10));

    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (Iteration._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [Iteration.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [Iteration.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - Iteration.getList - ', query.sql);
}
Iteration.getListByVersioId = function(versionId, callback) {
    var query = db.query('SELECT * FROM ?? WHERE version_id = ? ORDER BY start_time ASC', [Iteration.tablename, versionId], function(err, iterations) {
        if (err) {
            console.log(err);
            return;
        }
        callback(iterations);
    });
    console.log('sql - Iteration.getListByVersioId - ', query.sql);
}

Iteration.getById = function(id, callback) {
    id = parseInt(id, 10);
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [Iteration.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Iteration.getById - ', query.sql);
}
Iteration.getByUniqVN = function(versionId, name, callback) {
    var query = db.query('SELECT * FROM ?? WHERE version_id = ? AND name = ?', [Iteration.tablename, versionId, name], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Iteration.getById - ', query.sql);
}
Iteration.getRecentOneByVersionId = function(versionId, callback) { // 获取某版本最近一次迭代记录
    // 该版本，未过期，按照start_time排序，取1条
    var query = db.query('SELECT * FROM ?? WHERE version_id = ? AND end_time > ? ORDER BY start_time ASC LIMIT 1', [Iteration.tablename, versionId, moment().unix()], function(err, task) {
        if (err) {
            console.log(err);
            return;
        }
        task.length === 0 ? callback({}) : callback(task[0]);
    });
    console.log('sql - Task.getRecentOneByVersionId - ', query.sql);
}

Iteration.deleteById = function(id, callback) {
    var query = db.query('DELETE FROM ?? WHERE id = ?', [Iteration.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback();
    });
    console.log('sql - Iteration.deleteById - ', query.sql);
}

Iteration._isIncludeTotal = function(isIncludeTotal) {
    isIncludeTotal = parseInt(isIncludeTotal, 10);
    return isIncludeTotal === 0 ? false : true;
}

module.exports = Iteration;