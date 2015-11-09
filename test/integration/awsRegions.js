'use strict';

var expect     = require('chai').expect;
var awsRegions = require(__dirname + '/../../lib/awsRegions.js');
var AWS        = require('aws-sdk');

// setup AWS config
if (process.env.hasOwnProperty('AWS_DEFAULT_REGION')) {
  AWS.config.region = process.env.AWS_DEFAULT_REGION;
} else {
  AWS.config.region = 'us-east-1';
}

describe('awsRegions', function() {
  var _this = this;
  _this.awsRegionList = [];

  before(function(done) {
    var ec2 = new AWS.EC2();

    ec2.describeRegions({}, function (err, data) {
      var i;
      if (err) {
        throw err;
      }
      for (i=0; i < data.Regions.length; i++) {
        if (data.Regions[i].hasOwnProperty('RegionName')) {
          _this.awsRegionList.push(data.Regions[i].RegionName);
        } else {
          throw new Error('Unable to parse ec2.describeRegions response');
        }
      }
      done();
    });
  });

  it('matches ec2.describeRegions()', function() {
    expect(awsRegions).to.have.members(_this.awsRegionList);
  });
});
