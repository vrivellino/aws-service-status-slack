'use strict';

var winston       = require('winston');
var AwsStatusItem = require(__dirname + '/awsStatusItem.js');

function Constructor() {
  var pending = [];
  var itemStatus = {};
  var retryMax = 3;
  var retryInterval = 5 * 60 * 1000;

  this.pending = function () {
    return pending.length;
  };

  this.preProcess = function (unprocessed) {
    var rssItem;
    var processedItems = Object.keys(itemStatus).length;
    while (unprocessed.length) {
      rssItem = unprocessed.shift();
      if (processedItems) {
        if (itemStatus.hasOwnProperty(rssItem.guid)) {
          winston.log('debug', 'Already seen item, updating timestamp. ' +
            rssItem.guid);
          itemStatus[rssItem.guid].last = Date.now();
        } else {
          winston.log('debug', 'New RSS item, creating AwsStatusItem. ' +
            rssItem.guid);
          pending.push(new AwsStatusItem(rssItem));
          itemStatus[rssItem.guid] = {
            'status': 'pending', 'retries': 0, 'last': Date.now()
          };
        }
      } else {
        winston.log('debug', 'No processed items, this must be 1st fetch. ' +
          'Ignoring ' + rssItem.guid);
        itemStatus[rssItem.guid] = {
          'status': 'ignored', 'retries': 0, 'last': Date.now()
        };
      }
    }
  };

  this.postProcess = function (err, statusItem) {
    itemStatus[statusItem.guid()].last = Date.now();
    if (err) {
      winston.log('warning', 'Failed to process awsStatusItem. ' +
        statusItem.guid());
      winston.log('warning', err);
      if (--itemStatus[statusItem.guid()].retries >= retryMax) {
        itemStatus[statusItem.guid()].status = 'failed';
        winston.log('error', 'awsStatusItem ran out of retries. ' +
          statusItem.guid());
      } else {
        winston.log('info', 'Retrying awsStatusItem ' + statusItem.guid());
        pending.push(statusItem);
      }
    } else {
      itemStatus[statusItem.guid()].status = 'processed';
    }
  };

  this.processPending = function (itemHandler) {
    var statusItem;
    var itemsProcessed = 0;
    while (pending.length) {
      statusItem = pending.shift();
      
      if (! itemStatus.hasOwnProperty(statusItem.guid())) {
        winston.log('warning', 'pending awsStatusItem does not have a ' +
          'status: ' + statusItem.guid);
        itemStatus[statusItem.guid] = {
          'status': 'pending', 'retries': 0, 'last': Date.now()
        };
      }

      if (itemStatus[statusItem.guid()].status === 'pending' &&
         (itemStatus[statusItem.guid()].retries === 0 ||
          Date.now() - itemStatus[statusItem.guid()].last >= retryInterval)) {
        winston.log('debug', 'Processing awsStatusItem ' + statusItem.guid());
        itemHandler(statusItem, this.postProcess);
        ++itemsProcessed;
      }
    }
    winston.log('debug', itemsProcessed + ' awsStatusItems processed');
    return itemsProcessed;
  };

  this.purgeItemStatus = function (ts) {
    var deleted = 0;
    var guid;
    if (! ts) {
      ts = Date.now() - (2 * 86400 * 1000);
    }
    for (guid in itemStatus) {
      if (itemStatus.hasOwnProperty(guid) && itemStatus[guid].last < ts) {
        winston.log('debug', 'purging awsStatusItems ' + guid);
        delete itemStatus[guid];
        ++deleted;
      }
    }
    return deleted;
  };
}

module.exports = Constructor;
