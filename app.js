var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const MongoStore = require("connect-mongodb-session")(session);
const flash = require("express-flash");
const methodOverride = require("method-override");
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
require('dotenv').config();
require('./config/passport');
var app = express();

let db_uri = process.env.DB_URI;
mongoose.connect(db_uri, { useNewUrlParser: true, useCreateIndex: true })
  .then(console.log("database connected..."))
  .catch(err => console.log(err));


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: "mysecrect",
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ uri: db_uri, collection: "app_sessions" })
}));

app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
