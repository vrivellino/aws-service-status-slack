#!/usr/bin/env bash
set -ex

if [[ "$OSTYPE" == darwin* ]] && ! sed --version 2>&1 | grep -q GNU; then
    sed='sed -E'
else
    sed='sed -r'
fi

series_dir="$(pwd)/series"
mkdir -p new
pushd new > /dev/null
aws s3 sync s3://vr-aws-status-fetch/aws-status-rss/ ./

for f in 20*/* ; do
    mv "$f" "$series_dir/$(dirname $f)-$(basename $f).xml"
done

popd > /dev/null
pushd "$series_dir" > /dev/null

last_f=''
for f in *.xml ; do
    $sed '/^    [<](pubDate|updated)[>]/d' "$f" > "${f}.nodate"
    if [ -n "$last_f" ] && diff -q "${last_f}.nodate" "${f}.nodate"; then
        rm -f "$f" "${f}.nodate"
    else
        last_f="$f"
    fi
done
rm -f *.nodate

popd > /dev/null
rm -rf new
