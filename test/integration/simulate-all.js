'use strict';

var expect            = require('chai').expect;
var winston           = require('winston');
var AwsSvcStatusSlack =
  require(__dirname + '/../../lib/aws-service-status-slack.js');
var RssMock           = require(__dirname + '/../mock/rssfeed.js');
var SlackMock         = require(__dirname + '/../mock/slack.js');

var slackConfigs = [
  {},
  {includeRegions: ['sa-east-1']},
  {excludeRegions: ['sa-east-1', 'us-west-1']}
];
var rssUrl;

var expectedMessageCounts = [
  {sent: 0, recv: [0, 0, 0]}, // 0
  {sent: 2, recv: [1, 1, 0]}, // 1
  {sent: 2, recv: [1, 1, 0]}, // 2
  {sent: 2, recv: [1, 1, 0]}, // 3
  {sent: 2, recv: [1, 1, 0]}, // 4
  {sent: 2, recv: [1, 1, 0]}, // 5
  {sent: 2, recv: [1, 1, 0]}, // 6
  {sent: 2, recv: [1, 0, 1]}, // 7
  {sent: 2, recv: [1, 0, 1]}, // 8
  {sent: 2, recv: [1, 0, 1]}, // 9
  {sent: 1, recv: [1, 0, 0]}, // 10
  {sent: 1, recv: [1, 0, 0]}, // 11
  {sent: 1, recv: [1, 0, 0]}, // 12
  {sent: 2, recv: [1, 0, 1]}, // 13
  {sent: 2, recv: [1, 0, 1]}, // 14
  {sent: 2, recv: [1, 0, 1]}, // 15
  {sent: 2, recv: [1, 0, 1]}, // 16
  {sent: 2, recv: [1, 0, 1]}, // 17
  {sent: 2, recv: [1, 0, 1]}, // 18
  {sent: 4, recv: [2, 0, 2]}, // 19
  {sent: 4, recv: [2, 0, 2]}, // 20
  {sent: 2, recv: [1, 0, 1]}, // 21
  {sent: 2, recv: [1, 0, 1]}, // 22
  {sent: 2, recv: [1, 0, 1]}, // 23
  {sent: 2, recv: [1, 0, 1]}  // 24
];

winston.level = 'warn';
/*
winston.add(winston.transports.File, { filename: './debug.log' });
winston.remove(winston.transports.Console);
winston.level = 'debug';
*/

function startMocks(cb) {
  var rssMock = new RssMock();
  var configsProcessed = 0;

  rssMock.start(function (err, rssPort) {
    if (err) { throw err; }
    rssUrl = 'http://localhost:' + rssPort + '/rss';
    slackConfigs.forEach(function (config) {
      config.slackMock = new SlackMock();
      config.slackMock.start(function (err, slackPort) {
        if (err) { throw err; }
        config.webHookUri = 'http://localhost:' + slackPort + '/slack-webhook';
        if (++configsProcessed >= slackConfigs.length) {
          cb(null, configsProcessed);
        }
      });
    });
  });
}

describe('end-to-end simulation with rss and slack mocks', function () {
  var _this = this;
  _this.testStatus = {};
  before(function (done) {
    startMocks(function (err, data) {
      _this.slackMock = data.slackMock;
      _this.asss = new AwsSvcStatusSlack(rssUrl, slackConfigs);
      done();
    });
  });

  expectedMessageCounts.forEach(function (expectedMsgCount, i) {
    describe('RSS Fetch Iteration: ' + i, function () {
      before(function (done) {
        function testExecution() {
          var j;
          var testStatus = {};
          for (j = 0; j < slackConfigs.length; j++) {
            slackConfigs[j].slackMock.resetMessageCounts();
          }
          _this.asss.awsServiceStatusFetch(function (err) {
            if (err) { throw err; }
            _this.asss.awsServiceStatusProcess(function (err, data) {
              if (err) { throw err; }
              _this.slackMessagesSent = data;
              testStatus.slackMsgsSent = data;
              testStatus.slackMsgsRecv = [];
              for (j = 0; j < slackConfigs.length; j++) {
                testStatus.slackMsgsRecv[j] =
                  slackConfigs[j].slackMock.messageCount();
              }
              _this.testStatus[i] = testStatus;
              done();
            });
          });
        }
        var waitHandler = setInterval(function () {
          if (i === 0 || _this.testStatus.hasOwnProperty(i-1)) {
            if (! _this.testStatus.hasOwnProperty(i)) {
              testExecution();
            }
            waitHandler.close();
          }
        }, 50);
      });

      it('messages sent', function () {
        expect(_this.testStatus[i].slackMsgsSent)
          .to.equal(expectedMessageCounts[i].sent);
      });

      slackConfigs.forEach(function (config, j) {
        it('messages received - config ' + j, function () {
          expect(_this.testStatus[i].slackMsgsRecv[j])
            .to.equal(expectedMessageCounts[i].recv[j]);
        });
      });
    });
  });
});
