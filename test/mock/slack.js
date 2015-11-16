'use strict';

var express    = require('express');
var winston    = require('winston');

function Constructor() {
  var messageCount = 0;
  var messageCounts = {region: {}, service: {}};
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

  function updateMessageCounts(slackMsgFields) {
    var i;
    var fieldTitle;
    var fieldValue;

    for (i = 0; i < slackMsgFields.length; i++) {
      fieldTitle = null;
      fieldValue = null;
      if (slackMsgFields[i].hasOwnProperty('title')) {
        fieldTitle = slackMsgFields[i].title.toLowerCase();
      }
      if (slackMsgFields[i].hasOwnProperty('value')) {
        fieldValue = slackMsgFields[i].value;
      }

      if (fieldTitle && fieldValue) {
        if (messageCounts.hasOwnProperty(fieldTitle)) {
          if (messageCounts[fieldTitle].hasOwnProperty(fieldValue)) {
            ++messageCounts[fieldTitle][fieldValue];
          } else {
            ++messageCounts[fieldTitle][fieldValue];
          }
        }
      }
    }
  }

  // POST requests to /slack-webhook
  app.post('/slack-webhook', rawBody, function (req, res) {
    var requestBodyParsed = false;
    var slackMsg = {};
    winston.log('info', 'POST Request received for /slack-webhook: ' +
      req.rawBody);
    try {
      slackMsg = JSON.parse(req.rawBody);
      requestBodyParsed = true;
    } catch (e) {
      winston.log('error', 'Failed to parse request body: ' + req.rawBody);
    }
    if (slackMsg.hasOwnProperty('fields') && Array.isArray(slackMsg.fields)) {
      updateMessageCounts(slackMsg.fields);
    }
    res.setHeader('Content-Type', 'text/plain');
    if (requestBodyParsed) {
      ++messageCount;
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
  this.messageCount = function () {
    return messageCount;
  };
  this.regionCount = function () {
    return messageCounts.region;
  };
  this.serviceCount = function () {
    return messageCounts.service;
  };
}

module.exports = Constructor;
