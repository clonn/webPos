
/**
 * Module dependencies.
 */

var express = require('express'),
    config  = require('./config.ini'),
    cookieParser = require('connect').utils.parseCookie,
    routes = require('./routes'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    util = require('util'),
    FacebookStrategy = require('passport-facebook').Strategy;

var userData = {};

// set pasport
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});
passport.use(new FacebookStrategy({
    clientID: config.facebook.appid,
    clientSecret: config.facebook.secret,
    callbackURL: "http://userhost/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      return done(null, profile);
    });
  }
));


// Setup MongoDB
var Schema = mongoose.Schema
  , ObjectId = Schema.ObjectId;

// Danger! Write user/pwd here is not secure.
mongoose.connect(config.db);

// Define MongoDB Schema and Model

var WebChat = new Schema({
    who       : String
  , msg       : String
  , date      : Date
});
var Chat = mongoose.model('WebChat', WebChat);


// Setup Express

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  app.use(express.logger());
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({ secret: 'keyboard cat' }));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', function(req, res){
  if (req.user) {
      if (req.user.id) {
        res.cookie('userid', req.user.id);
      }
  }
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/chat', ensureAuthenticated, function(req, res){
  var docs;
  var query = Chat.find({});
  query.sort('date', 1);
  query.exec(function (err, val) {
      docs = val;
      res.render('chat', {
        title: 'Node.js Taiwan party',
        user: req.user,
        users: userData,
        docs: docs
      });
  });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
});

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    userData[req.user.id] = req.user;
    res.cookie('userid', req.user.id);
    return next();
  }
  res.redirect('/login')
}

function checkSocketExist(client, id) {
  var i;

  for (i in client) {
    if (client[i] == id) {
      return;
    }
  }
}

app.listen(process.env.VMC_APP_PORT || 3000);

var io = require('socket.io').listen(app);

if(process.env.VMC_APP_PORT) {
    io.set('transports', [
        'flashsocket',
        'htmlfile',
        'xhr-polling',
        'jsonp-polling'
    ]);
}

io.sockets.on('connection', function (socket) {
    var userCookie = cookieParser(socket.handshake.headers.cookie);
    ensureSocketAuth(userCookie);

    socket.broadcast.emit("login", {
        status: "ok",
        userid: userCookie.userid
    });

    socket.on('sendMsg', function (data) {
        var chat = new Chat();
        chat.who = userCookie.userid;
        chat.msg = data.msg;
        chat.date = new Date();
        chat.save(function (err) {
            if (!err) console.log('Message saved to mongodb.');
        });
        socket.broadcast.emit("recieveMsg", {
            status: "ok",
            userid: userCookie.userid,
            msg: data.msg
        });
    });
});

function ensureSocketAuth(cookie) {
    if (! userData[cookie.userid]) {
        return;
    }
}
