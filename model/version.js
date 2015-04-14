var db = require('./db');

function Version(isInsert) {
    this._isInsert = (isInsert !== undefined) ? isInsert : true;
}

Version.prototype.save = function(props, callback) {
    if (this._isInsert) {
        var sql = 'INSERT INTO ?? SET ?';
        var params = [Version.tablename, props];
    } else { // 更新
        var sql = 'UPDATE ?? SET ? WHERE id = ?';
        var id = props.id;
        delete props.id;
        var params = [Version.tablename, props, id];
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
    console.log('sql - Version.prototype.save - ', query.sql);
}

Version.tablename = 'version';
Version.getByUniqPN = function(projectId, name, callback) {
    var query = db.query('SELECT * FROM ?? WHERE project_id = ? AND name = ?', [Version.tablename, projectId, name], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Version.getByUniqPN - ', query.sql)
}
Version.getAll = function(pagination, includeTotal, callback) {
    return Version.getList(null, pagination, includeTotal, callback);
}
Version.getList = function(condition, pagination, includeTotal, callback) {
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [Version.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [Version.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(parseInt(pagination.offset, 10));
    props.push(parseInt(pagination.size, 10));

    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (Version._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [Version.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [Version.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - Version.getList - ', query.sql);
}
Version.getById = function(id, callback) {
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [Version.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Version.getById - ', query.sql);
}
Version.deleteById = function(id, callback) {
    var query = db.query('DELETE FROM ?? WHERE id = ?', [Version.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback();
    });
    console.log('sql - Version.deleteById - ', query.sql);
}

Version._isIncludeTotal = function(isIncludeTotal) {
    isIncludeTotal = parseInt(isIncludeTotal, 10);
    return isIncludeTotal === 0 ? false : true;
}

module.exports = Version;