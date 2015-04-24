var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'view'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
  dest: '/tmp/board'
}));
app.use(function(req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
    next();
});

// 路由
var siteController = require('./controller/index_controller');
var users = require('./controller/users');
var userController = require('./controller/user_controller');
var projectController = require('./controller/project_controller');
var versionController = require('./controller/version_controller');
var iterationController = require('./controller/iteration_controller');
var storyController = require('./controller/story_controller');
var taskStatusController = require('./controller/task_status_controller');
var taskController = require('./controller/task_controller');
var statisticController = require('./controller/statistics_controller');

app.use('/', siteController);
app.use('/users', users);
app.use('/user', userController);
app.use('/projects', projectController);
app.use('/versions', versionController);
app.use('/iterations', iterationController);
app.use('/stories', storyController);
app.use('/task_statuses', taskStatusController);
app.use('/tasks', taskController);
app.use('/statisticses', statisticController);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
