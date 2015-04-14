var db = require('./db');
var moment = require('moment');
var Helper = require('../library/helper');

function TaskStatus(name, sort) {
    this.name = name;
    this.sort = sort;
}

TaskStatus.prototype.save = function(callback) {
    var props = {
        name: this.name,
        sort: this.sort,
        create_time: moment().unix()
    };
    var query = db.query('INSERT INTO ?? SET ?', [TaskStatus.tablename, props], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (callback) {
            return callback(results.insertId);
        }
    });
    console.log('sql - TaskStatus.prototype.save - ', query.sql);
}

TaskStatus.tablename = 'task_status';

TaskStatus.getById = function(id, callback) {
    var query = db.query('SELECT * FROM ?? WHERE id = ?', [TaskStatus.tablename, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - TaskStatus.getById - ', query.sql);
}
TaskStatus.getOneByName = function(name, callback) {
    var query = db.query('SELECT * FROM ?? WHERE name = ?', [TaskStatus.tablename, name], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return results.length === 0 ? callback({}) : callback(results[0]);
    });
    console.log('sql - TaskStatus.getById - ', query.sql);
}
TaskStatus.getAll = function(pagination, includeTotal, callback) {
    return TaskStatus.getList(null, pagination, includeTotal, callback);
}
TaskStatus.getList = function(condition, pagination, includeTotal, callback) {
    if (condition === null) {
        var sql = 'SELECT * FROM ??';
        var props = [TaskStatus.tablename];
    } else {
        var sql = 'SELECT * FROM ?? WHERE ?';
        var props = [TaskStatus.tablename, condition];
    }
    sql += ' LIMIT ?, ?';
    props.push(parseInt(pagination.offset, 10));
    props.push(parseInt(pagination.size, 10));

    var query = db.query(sql, props, function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        if (TaskStatus._isIncludeTotal(includeTotal)) {
            if (condition === null) {
                var sql = 'SELECT COUNT(*) AS total FROM ??';
                var props = [TaskStatus.tablename];
            } else {
                var sql = 'SELECT COUNT(*) AS total FROM ?? WHERE ?';
                var props = [TaskStatus.tablename, condition];
            }
            db.query(sql, props, function(errOnTotal, resultsOnTotal) {
                return callback({total: resultsOnTotal[0].total, list: results});
            });
        } else {
            return callback(results);
        }
    });
    console.log('sql - TaskStatus.getList - ', query.sql);
}

TaskStatus.modiById = function (id, props, callback) {
    if (Helper.isEmptyObj(props)) {
        console.log('TaskStatus.modiById - empty props');
        return;
    }
    var query = db.query('UPDATE ?? SET ? WHERE id = ?', [TaskStatus.tablename, props, id], function(err, results) {
        if (err) {
            console.log(err);
            return;
        }
        return callback();
    });
    console.log('sql - TaskStatus.modiById - ', query.sql);
}

TaskStatus._isIncludeTotal = function(isIncludeTotal) {
    isIncludeTotal = parseInt(isIncludeTotal, 10);
    return isIncludeTotal === 0 ? false : true;
}

module.exports = TaskStatus;