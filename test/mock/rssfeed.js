'use strict';

var express    = require('express');
var fs         = require('fs');
var winston    = require('winston');

function Constructor() {
  var rssDir = __dirname + '/../fixtures/aws-status-rss';
  var rssResponseIndex = 0;
  var rssFiles = fs.readdirSync(rssDir).sort();

  var app = express();
  var server;

  // Helper to send RSS feed
  function sendRssFileResponse(res) {
    var rssFile;
    if (rssResponseIndex < rssFiles.length) {
      rssFile = rssDir + '/' + rssFiles[rssResponseIndex++];
      fs.readFile(rssFile, function (err, data) {
        if (err) {
          winston.log('error', err);
          res.status(500).send('Failed to open ' + rssFile);
        } else {
          winston.log('info', 'Sending ' + rssFile);
          res.setHeader('Content-Type', 'application/rss+xml');
          res.send(data);
        }
      });
    } else {
      res.setHeader('Content-Type', 'text/plain');
      res.status(404).send('No more RSS files');
    }
  }

  // GET requests to /rss to cycle through rssDir
  app.get('/rss', function (req, res) {
    winston.log('info', 'Request received for /rss');
    sendRssFileResponse(res);
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
}

module.exports = Constructor;
