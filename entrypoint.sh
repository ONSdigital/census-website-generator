#!/usr/bin/env bash

set -eu

envsubst '${EN_HOST} ${EN_ALIAS_HOSTS} ${CY_HOST} ${CY_ALIAS_HOSTS}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

find /usr/share/nginx/html/ -name "*.html" | while read fname; do
  envsubst '${EN_HOST} ${CY_HOST}' < "$fname" > "$fname".tmp
  mv -f "$fname".tmp "$fname"
done

nginx -g "daemon off;"
