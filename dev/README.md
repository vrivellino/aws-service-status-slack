Python script deployed to Lambda to download AWS Service Status RSS every 15 minutes.

To create a package, first install pip modules locally:

```
pip install --upgrade --target ./ boto
```

Then create an archive you can upload to Lambda:

```
zip -r awsstatusfetcher.zip awsstatusfetcher.py boto boto-*.distinfo
```
