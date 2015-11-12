'use strict';

var winston           = require('winston');
var AwsSvcStatusSlack =
  require(__dirname + '/../../lib/aws-service-status-slack.js');
var RssMock           = require(__dirname + '/rssfeed.js');
var SlackMock         = require(__dirname + '/slack.js');

winston.level = 'debug';

var rssMock = new RssMock();
var slackMock = new SlackMock();
var rssUrl;
var webhookUrl;
var asss;

if (process.env.hasOwnProperty('AWS_STATUS_FEED_SLACK_WEBHOOK')) {
  webhookUrl = process.env.AWS_STATUS_FEED_SLACK_WEBHOOK;
}

function setupAwsSvcStatusSlack() {
  asss = new AwsSvcStatusSlack(rssUrl, [{webHookUri: webhookUrl}]);
  setInterval(asss.purgeItemStatus, 30 * 1000);
  setInterval(asss.awsServiceStatusFetch, 5 * 1000);
  setInterval(asss.awsServiceStatusProcess, 1 * 1000);
}

rssMock.start(function (err, rssPort) {
  if (err) {
    console.log(err);
    process.exit(1);
  }
  rssUrl = 'http://localhost:' + rssPort + '/rss';
  if (webhookUrl) {
    setupAwsSvcStatusSlack();
  } else {
    slackMock.start(function (err, slackPort) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      webhookUrl = 'http://localhost:' + slackPort + '/slack-webhook';
      setupAwsSvcStatusSlack();
    });
  }
});
