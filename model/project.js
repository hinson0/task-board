// 依赖
var db = require('./db');
var moment = require('moment');

// 导出
module.exports = Project;

// 类
function Project(isInsert) {
    this._isInsert = (isInsert !== undefined) ? isInsert : true;
};

Project.prototype.save = function(props, callback) {
    if (this._isInsert) {
        var sql = 'INSERT INTO ?? SET ?';
        var params = [Project.tablename, props];
    } else { // 更新
        var sql = 'UPDATE ?? SET ? WHERE id = ?';
        var id = props.id;
        delete props.id;
        var params = [Project.tablename, props, id];
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
    console.log('sql - Project.prototype.save - ', query.sql);
}

// 类属性
Project.tablename = 'project';

// 类方法
Project.getList = function(condition, pagination, includeTotal, callback) { // 获取列表
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [Project.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [Project.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(parseInt(pagination.offset, 10));
    props.push(parseInt(pagination.size, 10));

    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (Project._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [Project.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [Project.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - Project.getList - ', query.sql);
};
Project.getByName = function(name, callback) {
    var query = db.query('SELECT * FROM ?? WHERE name = ?', [Project.tablename, name], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Project.getByName - ', query.sql);
}
Project.getById = function(id, callback) {
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [Project.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - Project.getById - ', query.sql);
}
Project.deleteById = function(id, callback) {
    var query = db.query('DELETE FROM ?? WHERE id = ?', [Project.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback();
    });
    console.log('sql - Project.deleteById - ', query.sql);
}

Project._isIncludeTotal = function(isIncludeTotal) {
    isIncludeTotal = parseInt(isIncludeTotal, 10);
    return isIncludeTotal === 0 ? false : true;
}
