
/**
 * Module dependencies.
 */

var express = require('express'),
    config  = require('./config.ini'),
    routes = require('./routes'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    util = require('util'),
    FacebookStrategy = require('passport-facebook').Strategy;

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
    callbackURL: "http://localhost:3000/auth/facebook/callback"
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
  res.render('index', { user: req.user });
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/chat', function(req, res){
  res.render('chat', {title: 'this is a chat room', user: req.user });
});

app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
    // The request will be redirected to Facebook for authentication, so this
    // function will not be called.
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
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}

app.listen(process.env.PORT || process.env.VCAP_APP_PORT || process.env.npm_package_config_port || 3000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
    socket.on('sendMsg', function (data) {
        console.log(data);
        var chat = new Chat();
        chat.who = 'guest';
        chat.msg = data.msg;
        chat.date = new Date();
        chat.save(function (err) {
            if (!err) console.log('Message saved to mongodb.');
        });
        socket.broadcast.emit("recieveMsg", {status: "ok", msg: data.msg});
    });
});
