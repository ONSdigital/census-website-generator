#!/usr/bin/env bash

set -e

if [[ ! -z "$BLOCK_REGEX" ]]; then
  export BLOCK_REGEX="location ~ ${BLOCK_REGEX} { return 404; }"
fi

envsubst '${EN_HOST} ${EN_ALIAS_HOSTS} ${CY_HOST} ${CY_ALIAS_HOSTS} ${BLOCK_REGEX}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

find /usr/share/nginx/html/ -name "*.html" | while read fname; do
  envsubst '${EN_HOST} ${CY_HOST} ${GA_PROP}' < "$fname" > "$fname".tmp
  mv -f "$fname".tmp "$fname"
done

nginx -g "daemon off;"
