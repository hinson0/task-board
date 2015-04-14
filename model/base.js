// 依赖
var db = require('./db');

// 导出
module.exports = Base;

// 基类
function Base(tablename, isInsert) {
    this.tablename = tablename;
    this._isInsert = isInsert ? isInsert : true;
}

Base.prototype.save = function(callback) {
    if (this._isInsert) {
        var sql = 'INSERT INTO ?? SET ?';
    } else { // 更新
        var sql = 'UPDATE ?? SET ?';
    }
    var self = this;
    var query = db.query(sql, [this.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - ' + this.tablename + '.prototype.save - ', query.sql);
}
Base.prototype.getOneById = function(id, callback) {
    id = parseInt(id, 10);
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [this.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - ' + this.tablename + '.prototype.getOneById - ', query.sql);
};
Base.prototype.getList = function(condition, pagination, includeTotal, callback) {
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [this.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [this.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(pagination.offset);
    props.push(pagination.size);
    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (this._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [this.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [this.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - ' + this.tablename + '.getList - ', query.sql);
};
