'use strict';

var Slack            = require('slack-node');
var winston          = require('winston');
var awsRegions       = require(__dirname + '/awsRegions.js');
var StatusFeed       = require(__dirname + '/statusFeed.js');
var statusFeedParser = require(__dirname + '/statusFeedParser.js');

function Constructor(rssFeed, slackConfigs) {
  var integrations = [];

  // Initialization helper
  (function () {
    var i;
    var j;
    var newIntegration;
    var optionalKeys = [];
    var Integration = function () {
      return {
        iconUrl: 'http://i.imgur.com/XhzVhKC.png',
        username: 'AWS Service Status',
        includeRegions: awsRegions.splice(),
        excludeRegions: [],
        channel: null
      };
    };

    for (i = 0; i < slackConfigs.length; i++ ) {
      newIntegration = new Integration();
      optionalKeys = Object.keys(newIntegration);
      newIntegration.slack = new Slack();
      if (slackConfigs[i].hasOwnProperty('webHookUri')) {
        newIntegration.slack.setWebhook(slackConfigs[i].webHookUri);
      } else {
        throw new Error('Slack Config missing required property "webHookUri"');
      }
      newIntegration.awsSvcStatusFeed = new StatusFeed();
      for (j = 0; j < optionalKeys; j++ ) {
        if (slackConfigs[i].hasOwnProperty(optionalKeys[j])) {
          newIntegration[optionalKeys[j]] = slackConfigs[i][j];
        }
      }
      winston.log('info', 'Configured integration: ' + newIntegration);
      integrations.push(newIntegration);
    }
  })();

  this.awsServiceStatusFetch = function() {
    statusFeedParser(rssFeed, function (err, unprocessedItems) {
      if (err) {
        winston.log('error', err);
      } else {
        winston.log('info', unprocessedItems.length +
          ' RSS items fetched from ' + rssFeed);
        integrations.forEach(function (integration) {
          integration.awsSvcStatusFeed.preprocess(unprocessedItems);
        });
      }
    });
  };

  this.awsServiceStatusProcess = function () {
    winston.log('info', 'Processing pending statuses');
    integrations.forEach(function (integration) {

      /* FILTER
        includeRegions: awsRegions.splice(),
        excludeRegions: [],
       */

      integration.awsSvcStatusFeed.processPending(function (statusItem, cb) {
        var slackParams = {
          username: integration.username,
          /*jshint -W106*/
          icon_emoji: integration.iconUrl,
          /*jshint +W106*/
          attachments: statusItem.getSlackAttachments()
        };
        if (integration.channel) {
          slackParams.channel = integration.channel;
        }
        function webhookCb(err, res) {
          if (err) { winston.log(err); }
          else {
            winston.log('debug', res);
            winston.log('info', statusItem.guid() + ' sent to ' +
              integration.slack.webhookUrl);
          }
          cb(err, statusItem);
        }
        integration.slack.webhook(slackParams, webhookCb);
      });
    });
  };

  this.purgeItemStatus = function () {
    // for each
    // awsBlah.purgeItemStatus()
    //
    winston.log('debug', 'Purge stuff');
  };
}

module.exports = Constructor;
