var express = require('express');
var app = express();
var mongo = require('mongodb').MongoClient;
var routes = require('./routes/index.js');
//initiate an http server and have it dispatch requests to express
var server = require('http').createServer(app);
// require the socket io module and allow it to use the http server to listen to requests
var io = require('socket.io')(server);

require('dotenv').config();

app.set('port', (process.env.PORT || 8080));

app.use('/public', express.static(process.cwd() + '/public'));

io.on('connection', function(client) {
  console.log('Client connected...');
  // listen for messages events
  client.on('messages', function(data){
      // broadcast to other connected users
      client.broadcast.emit('messages', data);
      // also emit to current client
      client.emit('messages', data);
  });
  // listen for delete messages
  client.on('deletedstock', function(data){
      // broadcast to other connected users
      client.broadcast.emit('deletedstock', data);
      // also emit to current client
      client.emit('deletedstock', data);
  });
});

mongo.connect(process.env.MONGO_URL || 'mongodb://localhost:27017/stocks', function (error, db) {
    if (error) {
    throw new Error('Database failed to connect!');
    } else {
    console.log('MongoDB successfully connected on port 27017.');
    }

    // routes
    routes(app, db);


    server.listen(app.get('port'), function() {
        console.log('Express server listening on port', app.get('port'));
    });
    
});