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

  this.awsServiceStatusFetch = function(done) {
    statusFeedParser(rssFeed, function (err, unprocessedItems) {
      var stillProcessing = integrations.length;
      var preProcessedItemCount = 0;
      if (err) {
        winston.log('error', err);
        if (typeof(done) === 'function') {
          done(err, null);
        }
      } else {
        winston.log('info', unprocessedItems.length +
          ' RSS items fetched from ' + rssFeed);
        integrations.forEach(function (integration) {
          preProcessedItemCount +=
            integration.awsSvcStatusFeed.preProcess(unprocessedItems.slice());
          if (--stillProcessing === 0) {
            done(null, preProcessedItemCount);
          }
        });
      }
    });
  };

  this.awsServiceStatusProcess = function (done) {
    var stillProcessing = integrations.length;
    var slackMessagesSent = 0;
    integrations.forEach(function (integration) {
      winston.log('info', 'Processing pending statuses for ' +
        integration.slack.webhookUrl);

      /* FILTER
        includeRegions: awsRegions.splice(),
        excludeRegions: [],
       */

      function slackItemHandler(statusItem, cb, itemsLeft) {
        var slackParams;

        // if not status item is set, we have nothing to process
        if (! statusItem) {
          winston.log('debug', 'No Pending messages for ' +
            integration.slack.webhookUrl);

          if (--stillProcessing === 0 && typeof(done) === 'function') {
            done(null, slackMessagesSent);
          }
          return cb();
        }

        slackParams = {
          username: integration.username,
          /*jshint -W106*/
          icon_emoji: integration.iconUrl,
          /*jshint +W106*/
          attachments: statusItem.getSlackAttachments()
        };

        if (integration.channel) {
          slackParams.channel = integration.channel;
        }
        integration.slack.webhook(slackParams, function (err, res) {
          if (err) { winston.log('error', err); }
          else {
            winston.log('debug', res);
            winston.log('info', statusItem.guid() + ' sent to ' +
              integration.slack.webhookUrl);
            ++slackMessagesSent;
          }
          if (itemsLeft === 0) {
            winston.log('debug', 'Processing complete for ' +
              integration.slack.webhookUrl);
            if (--stillProcessing === 0 && typeof(done) === 'function') {
              done(null, slackMessagesSent);
            }
          }
          return cb(err, statusItem);
        });
      }

      integration.awsSvcStatusFeed.processPending(slackItemHandler);
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
