'use strict';

var awsRegions = require(__dirname + '/awsRegions.js');

function Constructor(rssItem) {
  var itemData = {title: '', summary: '', pubdate: '', link: '', guid:''};
  var i;
  var itemAttributes = Object.keys(itemData);

  function parseGuid() {
    var guid = itemData.guid;
    var service;
    var region;
    var guidParts = guid.split('#');
    var regexp;
    var regexpResults;
    if (guidParts[0] !== itemData.link) {
      throw new Error('Unknown guid format - expecting base url: ' + guid);
    }
    service = guidParts[1].split('-')[0];
    if (! service) {
      throw new Error('Unknown guid format - cannot parse service: ' + guid);
    }
    regexp = new RegExp('^' + service + '-([a-z0-1-]+)_[0-9]+$', 'i');
    regexpResults = guidParts[1].match(regexp);
    if (! regexpResults) {
      throw new Error('Unknown guid format - cannot parse region: ' + guid);
    }
    region = regexpResults[1];

    if (awsRegions.indexOf(region) < 0) {
      throw new Error('Unknown guid format - unknown region ' +
          region + ': ' + guid);
    }
    
    itemData.service = service;
    itemData.region = region;
  }

  if (!rssItem) {
    throw new Error('RSS Item must be passed to constructor');
  }

  for (i = 0; i < itemAttributes.length; i++) {
    if (rssItem.hasOwnProperty(itemAttributes[i])) {
      itemData[itemAttributes[i]] = rssItem[itemAttributes[i]];
    } else {
      throw new Error('Missing required attribute ' + itemAttributes[i]);
    }
  }

  parseGuid();

  if (itemData.title.match(/RESOLVED/)) {
    itemData.color = 'good';
  } else {
    itemData.color = 'warning';
  }

  itemData.slackAttachment = {
    'fallback': itemData.pubdate.toUTCString() + ': ' +
      itemData.title + '\n' + itemData.summary,
    'color': itemData.color,
    'pretext': itemData.pubdate.toUTCString(),
    'title': itemData.title,
    'title_link': itemData.guid,
    'author_name': 'AWS Service Status',
    'author_link': itemData.link,
    'text': itemData.summary,
    'fields': [{
      'title': 'Region',
      'value': itemData.region,
      'short': true
    },{
      'title': 'Service',
      'value': itemData.service,
      'short': true
    }]
  };

  this.getSlackAttachments = function () {
    return [itemData.slackAttachment];
  };
}

module.exports = Constructor;
