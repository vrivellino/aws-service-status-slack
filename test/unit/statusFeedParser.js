'use strict';

var expect           = require('chai').expect;
var AwsStatusItem    = require('../../lib/awsStatusItem.js');
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

    it('description and summary are identical', function() {
      expect(_this.itemList[0].summary)
        .to.be.equal(_this.itemList[0].description);
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
