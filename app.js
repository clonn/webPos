
/**
 * Module dependencies.
 */

var express = require('express')
  , config  = require('./config.ini')
  , routes = require('./routes')
  , mongoose = require('mongoose');

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
  app.use(express.bodyParser());
  app.use(express.methodOverride());
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

app.get('/', routes.index);

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
