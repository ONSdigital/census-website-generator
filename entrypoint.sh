#!/usr/bin/env bash

set -eu

envsubst '${CY_HOST}' < /etc/nginx/conf.d/cy.conf.template > /etc/nginx/conf.d/cy.conf

nginx -g "daemon off;"
