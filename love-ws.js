var static = require('node-static'),
  redis = require('redis'),
  shared = require('./public/js/shared.js'),
  client = redis.createClient(),
  fileServer = new static.Server('./public'),
  WebSocketServer = require('ws').Server,
  app = require('http').createServer(function(request, response) {
    request.addListener('end', function() {
      fileServer.serve(request, response);
    });

  });
app.listen(9000);

var wss = new WebSocketServer({
  server: app
});

function broadcast(id, data, action) {
  for(var i = 0; i < wss.clients.length; i++) {
    wss.clients[i].send(JSON.stringify({
      'channel': id,
      'action': action,
      'data': data
    }));
  }
}

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    var json = JSON.parse(message);
    var id = shared.generateId(json["from"], json["to"]);
    if(shared.exists(json["message"])) {
      client.lpush(id, json["from"] + "|" + json["message"], function(err, res) {
        client.lrange(id, 0, res, function(err, res) {
          broadcast(id, res, 'list');
        });
      });
    } else {
      client.llen(id, function(err, res) {
        client.lrange(id, 0, res, function(err, res) {
          broadcast(id, res, 'list');
        });
      });
    }
  });
});