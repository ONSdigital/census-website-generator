#!/usr/bin/env bash

set -eu

envsubst '${EN_HOST} ${CY_HOST}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf
envsubst '${EN_HOST} ${CY_HOST}' < /etc/nginx/conf.d/cy.conf.template > /etc/nginx/conf.d/cy.conf

find /usr/share/nginx/html/ -name "*.html" | while read fname; do
  envsubst '${EN_HOST} ${CY_HOST}' < "$fname" > "$fname".tmp
  mv -f "$fname".tmp "$fname"
done

nginx -g "daemon off;"
