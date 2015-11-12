'use strict';

var express    = require('express');
var winston    = require('winston');

function Constructor() {
  var slackWebhookCount = 0;
  var app = express();
  var server;

  // Helper function to decode webhook post
  // using this because slack-node is not setting Content-Type
  function rawBody(req, res, next) {
    req.setEncoding('utf8');
    req.rawBody = '';
    req.on('data', function(chunk) {
      req.rawBody += chunk;
    });
    req.on('end', function(){
      next();
    });
  }

  // POST requests to /slack-webhook
  app.post('/slack-webhook', rawBody, function (req, res) {
    var requestBodyParsed = false;
    winston.log('info', 'POST Request received for /slack-webhook');
    try {
      JSON.parse(req.rawBody);
      requestBodyParsed = true;
    } catch (e) {
      winston.log('error', 'Failed to parse request body: ' + req.rawBody);
    }
    res.setHeader('Content-Type', 'text/plain');
    if (requestBodyParsed) {
      ++slackWebhookCount;
      res.send('ok');
    } else {
      res.status(500).send('Failed');
    }
  });

  // start express server
  this.start = function (cb) {
    server = app.listen(0, function () {
      var host = server.address().address;
      var port = server.address().port;
      winston.log('info', 'Listening on %s:%s', host, port);
      cb(null, port);
    });
  };

  // expose counter of slack webhook POSTs
  this.slackWebhookCount = function () {
    return slackWebhookCount;
  };
}

module.exports = Constructor;
