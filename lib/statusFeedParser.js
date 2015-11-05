'use strict';

var fs = require('fs');
var FeedParser = require('feedparser');

var Module = (function () {
  var statusFeedParser = function (localfile, cb) {
    var feedparser = new FeedParser();
    var readStream = fs.createReadStream(localfile);
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

    // Readsteam setup
    readStream.on('error', cb);
    readStream.pipe(feedparser);
  };

  return statusFeedParser;
}());

module.exports = Module;
