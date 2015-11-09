'use strict';

var expect           = require('chai').expect;
var fs               = require('fs');
var path             = require('path');
var AwsStatusItem    = require(__dirname + '/../../lib/awsStatusItem.js');
var statusFeedParser = require(__dirname + '/../../lib/statusFeedParser.js');

var rssfeed = 'http://status.aws.amazon.com/rss/all.rss';

var buildHistoricalList = function(done) {
  var dir = __dirname + '/../fixtures/series';
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(file) {
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          buildHistoricalList(file, function(err, res) {
            results = results.concat(res);
            if (!--pending) done(null, results);
          });
        } else {
          statusFeedParser(file, function (err, data) {
            if (err) throw err;
            data.forEach(function (item, index, arr) {
              results.push(new AwsStatusItem(item));
              if (index + 1 >= arr.length) {
                if (!--pending) done(null, results);
              }
            });
          });
        }
      });
    });
  });
};

describe('statusFeedParser()', function () {
  describe('parse AWS services status rss feed', function () {
    var _this = this;
    before(function (done) {
      _this.itemList = [];
      _this.item = null;
      statusFeedParser(rssfeed, function(err, data) {
        if (err) {
          throw err;
        }
        _this.itemList = data;
        _this.item = data[0];
        done();
      });
    });

    it('has 15 results', function () {
      expect(_this.itemList).to.have.length(15);
    });

    it('description and summary are identical', function () {
      expect(_this.item.summary).to.be.equal(_this.item.description);
    });

    it('results in AwsStatusItems', function () {
      var i;
      var statusItem;
      for (i=0; i < _this.itemList.length; i++) {
        statusItem = new AwsStatusItem(_this.itemList[i]);
        expect(statusItem.getSlackAttachments()[0].title).to.be.a('string');
      }
    });
  });

  describe('parse historical rss feeds', function () {
    var _this = this;
    before(function (done) {
      buildHistoricalList(function (err, results) {
        if (err) {
          done(err);
        } else {
          _this.rssHistorical = results;
          done();
        }
      });
    });

    it('historical status list built', function () {
      expect(_this.rssHistorical).to.have.length.of.at.least(150);
    });
  });
});
