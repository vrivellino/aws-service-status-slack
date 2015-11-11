'use strict';

var Slack            = require('slack-node');
var StatusFeed       = require(__dirname + '/lib/statusFeed.js');
var statusFeedParser = require(__dirname + '/lib/statusFeedParser.js');

var awsSvcStatusFeed = new StatusFeed();
var rssFeed = 'http://status.aws.amazon.com/rss/all.rss';
var iconUrl = 'http://i.imgur.com/XhzVhKC.png';
var debug = false;
var webhookUri;
var slack = new Slack();

// replace with command line args? use env vars?
webhookUri = process.env.AWS_STATUS_FEED_SLACK_WEBHOOK;
// iconUrl

slack.setWebhook(webhookUri);

function awsServiceStatusFetch() {
  statusFeedParser(rssFeed, function (err, unprocessedItems) {
    if (err) {
      console.log(err);
    } else {
      console.log(unprocessedItems.length +
          ' unprocessed items fetched from ' + rssFeed);
      awsSvcStatusFeed.preprocess(unprocessedItems);
    }
  });
}

function awsServiceStatusProcess() {
  awsSvcStatusFeed.processPending(function (statusItem, cb) {
    var slackParams = {
      username: 'AWS Status Feed',
      /*jshint -W106*/
      icon_emoji: iconUrl,
      /*jshint +W106*/
      attachments: statusItem.getSlackAttachments()
    };
    function webhookCb(err, res) {
      if (err) { console.log(err); }
      else if (debug) { console.log(res); }
      cb(err, statusItem);
    }
    slack.webhook(slackParams, webhookCb);
  });
}

// purge items every hour
setInterval(awsSvcStatusFeed.purgeItemStatus, 60 * 60 * 1000);

// fetch items ever 5 minutes
setInterval(awsServiceStatusFetch, 5 * 60 * 1000);

// process items every 30s
setInterval(awsServiceStatusProcess, 30 * 1000);
