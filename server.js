#!/usr/bin/env node

/**
 * Module dependencies
 */
// App dependencies
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// Server dependencies
var debug = require('debug')('t-chat:server');
var http = require('http');

// Customs requires (Middlewares)
var index = require('./routes/index');
var template = require('./routes/template');
var users = require('./middlewares/users');

// Definitions
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/template', template);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
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

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Create Socket.io instance
 */

var io = require('socket.io')(server);

io.on('connection', function (socket){
    console.log('[SOCKET-IO][NEW] New connection established. Socket : [' + socket.id + ']');
    socket.emit('connection.link', {id: "<0x00>", username: "System", content: socket.id});

    socket.on('connection.connect', function (msg) {
        var user;

        user = users.addUser(msg.id, msg.content);

        if (user !== null) {
            socket.emit('connection.connected', {id: "<0x00>", username: "System", success: true, content: {id: socket.id, username: user.name} } );
            console.log('[SOCKET-IO][EVENT][CONNECT] New user connected into T-Chat. User : [' + user.name + ']. Socket : [' + socket.id + ']');
            io.emit('chat message', {id: "<0x00>", username: "System", content: user.name + ' is now connected'});
        } else
            socket.emit('connection.connected', {id: "<0x00>", username: "System", success: false, content: "Please, try again."});
    });

    socket.on('chat.typing.start', function (msg) {
        socket.broadcast.emit('chat.typing.start', msg);
    });

    socket.on('chat.typing.end', function (msg) {
        socket.broadcast.emit('chat.typing.end', msg);
    });

    socket.on('chat message', function (msg){
        io.emit('chat message', msg);
    });

    socket.on('disconnect', function (){
        var user;

        user = users.removeUser(socket.id);

        if (user !== null) {
            console.log('[SOCKET-IO][DESTROY][S] Connection interrupted. User : [' + user.name + ']. Socket : [' + socket.id + '].');
            io.emit('chat message', {id: "<0x00>", username: "System", content: user.name + ' is now disconnected'});
        } else
            console.log('[SOCKET-IO][DESTROY][F] Connection interrupted but couldn\'t remove user info. Socket : [' + socket.id + ']');
    });
});


/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    var port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    if (error.syscall !== 'listen') {
        throw error;
    }

    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
    var addr = server.address();
    var bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    debug('Listening on ' + bind);
}
