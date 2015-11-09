from datetime import datetime
from urllib2 import urlopen
import boto

SITE = 'http://status.aws.amazon.com/rss/all.rss'  # URL of the site to check
EXPECTED = 'Amazon Web Services Service Status'  # String expected to be on the page
S3BUCKET = 'vr-aws-status-fetch'
S3CONN = boto.connect_s3()


def validate(res):
    '''Return False to trigger the canary

    Currently this simply checks whether the EXPECTED string is present.
    However, you could modify this to perform any number of arbitrary
    checks on the contents of SITE.
    '''
    return EXPECTED in res


def lambda_handler(event, context):
    print('Checking {} at {}...'.format(SITE, event['time']))
    content = urlopen(SITE).read()
    if not validate(content):
        raise Exception('Validation failed')

    dt = datetime.now()
    bucket = S3CONN.get_bucket(S3BUCKET, validate=False)
    s3path = 'aws-status-rss/' + str(dt.date()) + '/' + str(dt.time())
    objkey = bucket.new_key(s3path)
    objkey.set_contents_from_string(content)
    objkey.close()

    print 'Uploaded to {}'.format(S3BUCKET + '/' + s3path)
    return event['time']
