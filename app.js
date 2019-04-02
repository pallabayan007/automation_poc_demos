
/**
 * Module dependencies.
 */

var application_root=__dirname;
var express = require('express')
  , chatbot=require('./routes/chatbot')
  , http = require('http')
  , path = require('path');

  require("./utils/SocketManager.js");
  
var bodyParser = require( 'body-parser' );
var cookieParser = require( 'cookie-parser' );
var methodOverride = require('method-override');
var favicon = require('serve-favicon');
var cons = require('consolidate');
var app = express();
var router = express.Router();

// all environments
var port = process.env.PORT || process.env.VCAP_APP_PORT || 1185;
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

app.engine('html', cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.use(favicon(path.join(__dirname, '/views/favicon.ico')));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html',require('ejs').__express);


app.get('/', function(req, res){
  res.render('chatbot',{msg:''});
});

//To get Geo Location
app.get('/geoLocation', function(req, res){
  res.render('geoLocation',{msg:'Get your Lat & Long'});
});

router.post('/api/message',chatbot.apiMessage);
app.use('/', router);
module.exports = app;


// Enable Socket IO
var httpServer = http.Server(app);
var io = require("socket.io")(httpServer);
io.on('connection', function(socket){
  SocketManager.add(socket);
});

httpServer.listen(port, function() {
  console.log('Server running on port: %d', port);
});
