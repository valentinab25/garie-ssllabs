#!/usr/bin/env bash
echo "Start getting data"

echo "Getting data for: $1"

report_location=$2/$(date +"%FT%H%M%S+0000")

mkdir -p $report_location

docker run --read-only --cap-drop all --rm -it jumanjiman/ssllabs-scan:latest -grade -usecache $1 2>&1 > $report_location/result.html

echo "Finished getting data for: $1"

exit 0

