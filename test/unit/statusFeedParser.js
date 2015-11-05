'use strict';

var expect           = require('chai').expect;
var statusFeedParser = require('../../lib/statusFeedParser.js');

var filename = 'test/fixtures/aws-status-rss-20151104-211913.xml';

describe('statusFeedParser()', function() {
  describe('parse local file', function() {
    var _this = this;
    _this.itemList = [];
    beforeEach(function(done) {
      statusFeedParser(filename, function(err, data) {
        if (err) {
          throw err;
        }
        _this.itemList = data;
        done();
      });
    });

    it('has 15 results', function() {
      expect(_this.itemList).to.have.length(15);
    });
  });
});
