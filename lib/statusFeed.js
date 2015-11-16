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
    var statusItem;
    var processedItems = Object.keys(itemStatus).length;
    while (unprocessed.length) {
      statusItem = new AwsStatusItem(unprocessed.shift());
      if (processedItems) {

        if (itemStatus.hasOwnProperty(statusItem.msgMd5())) {
          if (itemStatus[statusItem.msgMd5()].guid ===
              statusItem.guid()) {
            winston.log('debug', 'Already seen item ... ignoring: ' +
              statusItem.guid());
          } else {
            winston.log('debug', 'Already saw message with different guid ' +
              ' ... ignoring ' + statusItem.guid());
            winston.log('debug', 'DEBUG: ' +
              JSON.stringify(itemStatus[statusItem.msgMd5()]));
          }
          itemStatus[statusItem.msgMd5()].last = Date.now();

        } else {
          winston.log('debug', 'New RSS item, adding to pending queue: ' +
            statusItem.msgMd5());

          pending.push(statusItem);
          itemStatus[statusItem.msgMd5()] = {
            'status': 'pending', 'retries': 0,
            'last': Date.now(), 'guid': statusItem.guid()
          };
        }
      } else {
        winston.log('debug', 'No processed items, this must be 1st fetch. ' +
          'Ignoring ' + statusItem.guid());
        itemStatus[statusItem.msgMd5()] = {
          'status': 'ignored', 'retries': 0,
          'last': Date.now(), 'guid': statusItem.guid()
        };
      }
    }
    pending = pending.sort(function (a, b) {
      return a.pubDateTs() - b.pubDateTs();
    });
  };

  this.postProcess = function (err, statusItem) {
    itemStatus[statusItem.msgMd5()].last = Date.now();
    if (err) {
      winston.log('warning', 'Failed to process awsStatusItem. ' +
        statusItem.guid());
      winston.log('warning', err);
      if (--itemStatus[statusItem.msgMd5()].retries >= retryMax) {
        itemStatus[statusItem.msgMd5()].status = 'failed';
        winston.log('error', 'awsStatusItem ran out of retries. ' +
          statusItem.guid());
      } else {
        winston.log('info', 'Retrying awsStatusItem ' + statusItem.guid());
        pending.push(statusItem);
      }
    } else {
      itemStatus[statusItem.msgMd5()].status = 'processed';
    }
  };

  this.processPending = function (itemHandler) {
    var statusItem;
    var itemsProcessed = 0;
    if (pending.length === 0) {
      itemHandler(null, function () { return true; }, 0);
    }
    while (pending.length) {
      statusItem = pending.shift();
      
      if (! itemStatus.hasOwnProperty(statusItem.msgMd5())) {
        winston.log('warning', 'pending awsStatusItem does not have a ' +
          'status: ' + statusItem.guid());
        itemStatus[statusItem.msgMd5()] = {
          'status': 'pending', 'retries': 0,
          'last': Date.now(), 'guid': statusItem.guid()
        };
      }

      if (itemStatus[statusItem.msgMd5()].status === 'pending' &&
         (itemStatus[statusItem.msgMd5()].retries === 0 ||
          Date.now() - itemStatus[statusItem.msgMd5()].last >= retryInterval)) {
        winston.log('debug', 'Processing awsStatusItem ' + statusItem.guid());
        itemHandler(statusItem, this.postProcess, pending.length);
        ++itemsProcessed;
      }
    }
    winston.log('debug', itemsProcessed + ' awsStatusItems processed');
    return itemsProcessed;
  };

  this.purgeItemStatus = function (ts) {
    var deleted = 0;
    var msgMd5;
    if (! ts) {
      ts = Date.now() - (2 * 86400 * 1000);
    }
    for (msgMd5 in itemStatus) {
      if (itemStatus.hasOwnProperty(msgMd5) && itemStatus[msgMd5].last <= ts) {
        winston.log('debug', 'purging awsStatusItems ' + msgMd5);
        delete itemStatus[msgMd5];
        ++deleted;
      }
    }
    return deleted;
  };
}

module.exports = Constructor;
