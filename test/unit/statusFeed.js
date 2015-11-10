'use strict';

var expect     = require('chai').expect;
var StatusFeed = require('../../lib/statusFeed.js');

var rss1 = 'test/fixtures/aws-status-rss-20151104-211913.xml';
var rss2 = 'test/fixtures/aws-status-rss-20151105-062131.xml';

describe('statusFeed', function() {
  var _this = this;
  _this.statusFeed = new StatusFeed(rss1);
  before(function (done) {
    _this.statusFeed.fetch(function(err) {
      if (err) { throw err; }
      done();
    });
  });

  describe('.fetch()', function () {
    it('produces 15 unprocessed', function () {
      expect(_this.statusFeed.unprocessed()).to.equal(15);
    });
  });

  describe('.preprocess()', function() {
    before(function () {
      _this.statusFeed.preprocess();
    });
    it('produces no pending', function () {
      expect(_this.statusFeed.pending()).to.equal(0);
    });
    it('empties unprocessed', function () {
      expect(_this.statusFeed.unprocessed()).to.equal(0);
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
      _this.statusFeed.feedlocation(rss2);
      _this.statusFeed.fetch(function(err) {
        if (err) { throw err; }
        done();
      });
    });

    describe('.fetch()', function () {
      it('produces 15 unprocessed', function () {
        expect(_this.statusFeed.unprocessed()).to.equal(15);
      });
    });

    describe('.preprocess()', function () {
      before(function () {
        _this.statusFeed.preprocess();
      });
      it('produces 1 pending', function () {
        expect(_this.statusFeed.pending()).to.equal(1);
      });
      it('empties unprocessed', function () {
        expect(_this.statusFeed.unprocessed()).to.equal(0);
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
      it('returns one', function () {
        expect(_this.processPendingResult).to.equal(1);
      });
      it('processes one', function () {
        expect(_this.processedItems).to.equal(1);
      });
    });

    describe('.purgeItemStatus()', function() {
      before(function () {
        _this.purgeItemStatusResult =
          _this.statusFeed.purgeItemStatus(_this.purgeTime);
      });
      it('returns one', function () {
        expect(_this.purgeItemStatusResult).to.equal(1);
      });
    });
  });
});
