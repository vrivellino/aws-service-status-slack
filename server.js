'use strict';

var Slack            = require('slack-node');
var winston          = require('winston');
var StatusFeed       = require(__dirname + '/lib/statusFeed.js');
var statusFeedParser = require(__dirname + '/lib/statusFeedParser.js');

// fetch RSS feed every 5 minutes
var rssFetchInterval = 5 * 60 * 1000;
// process pending (unsent) items every 10s
var statusProcessInterval = 10 * 1000;
// purge old item status every hour
var itemStatusPurgeInterval = 60 * 60 * 1000;

var rssFeed = 'http://status.aws.amazon.com/rss/all.rss';
var iconUrl = 'http://i.imgur.com/XhzVhKC.png';
var debug = false;
var webhookUri;

var awsSvcStatusFeed = new StatusFeed();
var slack = new Slack();

// replace with command line args? use env vars?
webhookUri = process.env.AWS_STATUS_FEED_SLACK_WEBHOOK;
// iconUrl

slack.setWebhook(webhookUri);

function awsServiceStatusFetch() {
  statusFeedParser(rssFeed, function (err, unprocessedItems) {
    if (err) {
      winston.log('error', err);
    } else {
      winston.log('info', unprocessedItems.length +
        ' RSS items fetched from ' + rssFeed);
      awsSvcStatusFeed.preprocess(unprocessedItems);
    }
  });
}

function awsServiceStatusProcess() {
  winston.log('info', 'Processing pending statuses');
  awsSvcStatusFeed.processPending(function (statusItem, cb) {
    var slackParams = {
      username: 'AWS Status Feed',
      /*jshint -W106*/
      icon_emoji: iconUrl,
      /*jshint +W106*/
      attachments: statusItem.getSlackAttachments()
    };
    function webhookCb(err, res) {
      if (err) { winston.log(err); }
      else if (debug) { winston.log(res); }
      else { winston.log(statusItem.guid() + ' sent to ' + slack.webhookUrl); }
      cb(err, statusItem);
    }
    slack.webhook(slackParams, webhookCb);
  });
}

setInterval(awsSvcStatusFeed.purgeItemStatus, itemStatusPurgeInterval);
setInterval(awsServiceStatusFetch, rssFetchInterval);
setInterval(awsServiceStatusProcess, statusProcessInterval);
