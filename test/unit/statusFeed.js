'use strict';

var expect           = require('chai').expect;
var statusFeedParser = require(__dirname + '/../../lib/statusFeedParser.js');
var StatusFeed       = require(__dirname + '/../../lib/statusFeed.js');

var rss1 = 'test/fixtures/aws-status-rss-20151104-211913.xml';
var rss2 = 'test/fixtures/aws-status-rss-20151105-062131.xml';

describe('statusFeed', function() {
  var _this = this;
  _this.statusFeed = new StatusFeed();
  _this.unprocessedRssItems = [];
  before(function (done) {
    statusFeedParser(rss1, function(err, data) {
      if (err) { throw err; }
      _this.unprocessedRssItems = data;
      done();
    });
  });

  describe('.preProcess()', function() {
    before(function () {
      _this.statusFeed.preProcess(_this.unprocessedRssItems);
    });
    it('produces no pending', function () {
      expect(_this.statusFeed.pending()).to.equal(0);
    });
  });

  describe('.processPending()', function() {
    before(function () {
      _this.processPendingResult =
        _this.statusFeed.processPending(function () { return; });
    });
    it('returns zero', function () {
      expect(_this.processPendingResult).to.equal(0);
    });
  });

  describe('.purgeItemStatus()', function() {
    before(function () {
      _this.purgeItemStatusResult = _this.statusFeed.purgeItemStatus();
    });
    it('returns one', function () {
      expect(_this.purgeItemStatusResult).to.equal(0);
    });
  });

  describe('After rss2 is fetched', function() {
    before(function (done) {
      _this.purgeTime = Date.now();
      _this.unprocessedRssItems = [];
      statusFeedParser(rss2, function(err, data) {
        if (err) { throw err; }
        _this.unprocessedRssItems = data;
        done();
      });
    });

    describe('.preProcess()', function () {
      before(function () {
        _this.statusFeed.preProcess(_this.unprocessedRssItems);
      });
      it('produces 1 pending', function () {
        expect(_this.statusFeed.pending()).to.equal(1);
      });
    });

    describe('.processPending()', function() {
      before(function (done) {
        _this.processedItems = 0;
        _this.processPendingResult = _this.statusFeed.processPending(
          function (statusItem, cb) {
            cb(null, statusItem);
            ++_this.processedItems;
            done();
          }
        );
      });
      it('returns 1', function () {
        expect(_this.processPendingResult).to.equal(1);
      });
      it('processes 1', function () {
        expect(_this.processedItems).to.equal(1);
      });
    });

    describe('.purgeItemStatus()', function() {
      before(function () {
        _this.purgeItemStatusResult =
          _this.statusFeed.purgeItemStatus(_this.purgeTime);
      });
      it('purges 1', function () {
        expect(_this.purgeItemStatusResult).to.equal(1);
      });
    });
  });
});
