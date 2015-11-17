'use strict';

var winston           = require('winston');
var AwsSvcStatusSlack = require(__dirname + '/lib/aws-service-status-slack.js');

/*** DEFAULTS ***/
// fetch RSS feed every 5 minutes
var rssFetchInterval = 5 * 60 * 1000;
// process pending (unsent) items every 10s
var statusProcessInterval = 10 * 1000;
// purge old item status every hour
var itemStatusPurgeInterval = 60 * 60 * 1000;
// AWS Service Status RSS feed URL
var rssUrl = 'http://status.aws.amazon.com/rss/all.rss';

var webhookUrl;
var asss;

winston.level = 'info';

if (process.env.hasOwnproperty('AWS_STATUS_FEED_SLACK_WEBHOOK')) {
  webhookUrl = process.env.AWS_STATUS_FEED_SLACK_WEBHOOK;
}

// Placeholder
/* options = {
  webHookUri: 'http://something',
  iconUrl: 'http://i.imgur.com/XhzVhKC.png',
  username: 'AWS Service Status',
  includeRegions: awsRegions.slice(),
  excludeRegions: [],
  channel: null
};
*/

asss = new AwsSvcStatusSlack(rssUrl, [{webHookUri: webhookUrl}]);
setInterval(asss.awsServiceStatusFetch, rssFetchInterval);
setInterval(asss.awsServiceStatusProcess, statusProcessInterval);
setInterval(asss.purgeItemStatus, itemStatusPurgeInterval);
