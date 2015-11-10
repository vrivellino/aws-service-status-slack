'use strict';

var statusFeedParser = require(__dirname + '/statusFeedParser.js');
var AwsStatusItem    = require(__dirname + '/awsStatusItem.js');

function Constructor(rssfeed) {
  var rssfeedLocation = rssfeed;
  var unprocessed = [];
  var pending = [];
  var itemStatus = {};
  var retryMax = 3;
  var retryInterval = 5 * 60 * 1000;

  this.feedlocation = function (rssfeed) {
    if (rssfeed) {
      rssfeedLocation = rssfeed;
    }
    return rssfeedLocation;
  };

  this.unprocessed = function () {
    return unprocessed.length;
  };

  this.pending = function () {
    return pending.length;
  };

  this.fetch = function (cb) {
    statusFeedParser(rssfeedLocation, function (err, itemList) {
      if (err) { cb(err, null); }
      unprocessed = unprocessed.concat(itemList);
      cb(null, itemList.length);
    });
  };

  this.preprocess = function () {
    var rssItem;
    var processedItems = Object.keys(itemStatus).length;
    while (unprocessed.length) {
      rssItem = unprocessed.shift();
      if (processedItems) {
        if (itemStatus.hasOwnProperty(rssItem.guid)) {
          itemStatus[rssItem.guid].last = Date.now();
        } else {
          pending.push(new AwsStatusItem(rssItem));
          itemStatus[rssItem.guid] = {
            'status': 'pending', 'retries': 0, 'last': Date.now()
          };
        }
      } else {
        itemStatus[rssItem.guid] = {
          'status': 'ignored', 'retries': 0, 'last': Date.now()
        };
      }
    }
  };

  this.postProcess = function (err, statusItem) {
    itemStatus[statusItem.guid()].last = Date.now();
    if (err) {
      pending.push(statusItem);
      if (--itemStatus[statusItem.guid()].retries >= retryMax) {
        itemStatus[statusItem.guid()].status = 'failed';
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
        console.log('WARNING: pending awsStatusItem does not have a status: ' +
            statusItem.guid);
        itemStatus[statusItem.guid] = {
          'status': 'pending', 'retries': 0, 'last': Date.now()
        };
      }

      if (itemStatus[statusItem.guid()].status === 'pending' &&
         (itemStatus[statusItem.guid()].retries === 0 ||
          Date.now() - itemStatus[statusItem.guid()].last >= retryInterval)) {
        itemHandler(statusItem, this.postProcess);
        ++itemsProcessed;
      }
    }
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
        delete itemStatus[guid];
        ++deleted;
      }
    }
    return deleted;
  };
}

module.exports = Constructor;
