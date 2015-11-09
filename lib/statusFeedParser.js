'use strict';

var FeedParser = require('feedparser');
var fs = require('fs');
var request = require('request');

var Module = (function () {
  var statusFeedParser = function (rssfeed, cb) {
    var feedparser = new FeedParser();
    var fsRead;
    var req;
    var items = [];

    // Feedparser stream setup
    feedparser.on('error', cb);
    feedparser.on('readable', function() {
      var stream = this;

      var item = stream.read();
      while (item) {
        items.unshift(item);
        item = stream.read();
      }
    });
    feedparser.on('end', function() {
      cb(null, items);
    });

    // if rssfeed matches a URL, setup a http request ...
    if (rssfeed.match(/^http(s)?:\/\//)) {
      req = request(rssfeed);
      req.on('error', cb);
      req.on('response', function (res) {
        if (res.statusCode !== 200) {
          return this.emit('error', new Error('Bad status code'));
        }
        this.pipe(feedparser);
      });

    // otherwise assume we're parsing a local file ...
    } else {
      fsRead = fs.createReadStream(rssfeed);
      fsRead.on('error', cb);
      fsRead.pipe(feedparser);
    }
  };

  return statusFeedParser;
}());

module.exports = Module;
