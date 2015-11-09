'use strict';

var expect           = require('chai').expect;
var AwsStatusItem    = require('../../lib/awsStatusItem.js');
var statusFeedParser = require('../../lib/statusFeedParser.js');

var rssfeed = 'http://status.aws.amazon.com/rss/all.rss';

describe('statusFeedParser()', function () {
  describe('parse AWS services status rss feed', function() {
    var _this = this;
    before(function(done) {
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

    it('description and summary are identical', function() {
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
});
