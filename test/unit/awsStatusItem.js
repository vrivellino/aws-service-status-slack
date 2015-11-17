'use strict';

var expect     = require('chai').expect;
var AwsStatusItem = require('../../lib/awsStatusItem.js');

var defaultStatusUrl = 'http://status.aws.amazon.com/';
var defaultRegion = 'us-east-1';
var defaultColor = 'warning';
var goodColor = 'good';

describe('awsStatusItem', function () {
  describe('Constructor Exceptions', function () {
    it('throws exception with no argument', function () {
      var fn = function () { return new AwsStatusItem(); };
      expect(fn).to.throw(Error);
    });

    it('throws exception with missing attribute', function () {
      var fn = function () { return new AwsStatusItem({
        title: 'test', summary: 'test'
      }); };
      expect(fn).to.throw(Error);
    });

    describe('.parseGuid()', function () {
      it('throws exception with no url', function () {
        var fn = function () { return new AwsStatusItem({
          title: 'test', summary: 'test', pubdate: new Date(),
          link: 'http://www.foo/', guid: 'ec2-us-east-1-123456780'
        }); };
        expect(fn).to.throw(Error);
      });

      it('throws exception with mismatching url', function () {
        var fn = function () { return new AwsStatusItem({
          title: 'test', summary: 'test', pubdate: new Date(),
          link: 'http://www.foo/',
          guid: 'http://status.aws.foobar#ec2-us-east-1-123456780'
        }); };
        expect(fn).to.throw(Error);
      });

      it('throws exception with bad svc-region_ts format', function () {
        var fn = function () { return new AwsStatusItem({
          title: 'test', summary: 'test', pubdate: new Date(),
          link: 'http://www.foo/',
          guid: 'http://www.foo/#ec2_us_east_1_123456780'
        }); };
        expect(fn).to.throw(Error);
      });

      it('throws exception with no region', function () {
        var fn = function () { return new AwsStatusItem({
          title: 'test', summary: 'test', pubdate: new Date(),
          link: 'http://www.foo/',
          guid: 'http://www.foo/#ec2-missing_123456780'
        }); };
        expect(fn).to.throw(Error);
      });

      it('throws exception with unknown region', function () {
        var fn = function () { return new AwsStatusItem({
          title: 'test', summary: 'test', pubdate: new Date(),
          link: 'http://www.foo/',
          guid: 'http://www.foo/#ec2-us-UNKNOWN-10_123456780'
        }); };
        expect(fn).to.throw(Error);
      });
    });
  });

  describe('new AwsStatusItem', function () {
    var _this = this;
    beforeEach(function () {
      _this.title = 'Test Title';
      _this.summary = 'Test summary text.';
      _this.dt = new Date();
      _this.itemId = defaultStatusUrl + '#ec2-' + defaultRegion + '_' +
        Math.floor(_this.dt.getTime() / 1000);
      _this.awsStatusItem = new AwsStatusItem({
        title: _this.title, summary: _this.summary, pubdate: _this.dt,
        link: defaultStatusUrl, guid: _this.itemId
      });
      _this.slackAttachmentList = _this.awsStatusItem.getSlackAttachments();
      _this.slackAttachment = _this.slackAttachmentList[0];
    });

    describe('.guid()', function () {
      it('macthes', function () {
        expect(_this.awsStatusItem.guid()).to.equal(_this.itemId);
      });
    });

    describe('.region()', function () {
      it('macthes', function () {
        expect(_this.awsStatusItem.region()).to.equal(defaultRegion);
      });
    });

    describe('.service()', function () {
      it('macthes', function () {
        expect(_this.awsStatusItem.service()).to.equal('ec2');
      });
    });

    describe('.getSlackAttachments()', function () {
      it('one attachment', function () {
        expect(_this.slackAttachmentList).to.have.length(1);
      });

      it('fallback', function () {
        expect(_this.slackAttachment.fallback).to.be.a('string');
      });

      it('default color', function () {
        expect(_this.slackAttachment.color).to.equal(defaultColor);
      });

      it('pretext', function () {
        expect(_this.slackAttachment.pretext).to.equal(_this.dt.toUTCString());
      });

      it('title', function () {
        /*jshint -W106*/
        expect(_this.slackAttachment.title).to.equal(_this.title);
        /*jshint +W106*/
      });

      it('title_link', function () {
        /*jshint -W106*/
        expect(_this.slackAttachment.title_link).to.equal(_this.itemId);
        /*jshint +W106*/
      });

      it('author_name', function () {
        /*jshint -W106*/
        expect(_this.slackAttachment.author_name)
          .to.equal('AWS Service Status');
        /*jshint +W106*/
      });

      it('author_link', function () {
        /*jshint -W106*/
        expect(_this.slackAttachment.author_link).to.equal(defaultStatusUrl);
        /*jshint +W106*/
      });

      it('text', function () {
        expect(_this.slackAttachment.text).to.equal(_this.summary);
      });

      it('fields', function () {
        expect(_this.slackAttachment.fields[0]).to
          .have.all.keys(['title', 'value', 'short']);
        expect(_this.slackAttachment.fields[1]).to
          .have.all.keys(['title', 'value', 'short']);
      });

      describe('title parse of "good" message', function () {
        beforeEach(function () {
          _this.title = 'Test Title: [RESOLVED] Something was fixed';
          _this.awsStatusItem = new AwsStatusItem({
            title: _this.title, summary: _this.summary, pubdate: _this.dt,
            link: defaultStatusUrl, guid: _this.itemId
          });
        });
        it('good color', function () {
          var slackAttachment = _this.awsStatusItem.getSlackAttachments()[0];
          expect(slackAttachment.color).to.equal(goodColor);
        });
      });
    });
  });
});
