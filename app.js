require('dotenv').config();

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./app_server/routes/index');
var usersRouter = require('./app_server/routes/users');
var travelRouter = require('./app_server/routes/travel');
var roomsRouter = require('./app_server/routes/rooms');
var newsRouter = require('./app_server/routes/news');
var mealsRouter = require('./app_server/routes/meals');
var contactRouter = require('./app_server/routes/contact');
var aboutRouter = require('./app_server/routes/about');
var handlebars = require('hbs');
var apiRouter = require('./app_api/routes/index');

// Wire in our authentication module
var passport = require('passport');
require('./app_api/config/passport');

var app = express();
var clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:4200';

require('./app_api/models/db');

// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));
handlebars.registerPartials(__dirname + '/app_server/views/partials');

app.set('view engine', 'hbs');



app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', clientOrigin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/travel', travelRouter);
app.use('/rooms', roomsRouter);
app.use('/news', newsRouter);
app.use('/meals', mealsRouter);
app.use('/contact', contactRouter);
app.use('/about', aboutRouter);
app.use('/api', apiRouter);

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(err.status || 500).json({
      message: err.status && err.status < 500
        ? err.message
        : 'An unexpected server error occurred.'
    });
  }

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
