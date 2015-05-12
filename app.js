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
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(multer({
  dest: '/tmp/board'
}));
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization');
  next();
});

// 路由
var SiteController = require('./controller/index_controller');
var UserController = require('./controller/user_controller');
var ProjectController = require('./controller/project_controller');
var VersionController = require('./controller/version_controller');
var IterationController = require('./controller/iteration_controller');
var StoryController = require('./controller/story_controller');
var TaskController = require('./controller/task_controller');
var TaskStatusController = require('./controller/task_status_controller');
var StatisticController = require('./controller/statistics_controller');
var MsgController = require('./controller/msg_controller');

app.use('/', SiteController);
app.use('/user', UserController);
app.use('/projects', ProjectController);
app.use('/versions', VersionController);
app.use('/iterations', IterationController);
app.use('/stories', StoryController);
app.use('/tasks', TaskController);
app.use('/task_statuses', TaskStatusController);
app.use('/statisticses', StatisticController);
app.use('/msgs', MsgController);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
