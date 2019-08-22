FROM node:10 as builder

WORKDIR /website

COPY . /website

RUN npm install

ENV NODE_ENV live

ENV EN_SITE "https://\${EN_HOST}/"
ENV CY_SITE "https://\${CY_HOST}/"

RUN npm run generate-site

###############################################################################
# Second Stage
###############################################################################

FROM nginx

COPY ./entrypoint.sh /etc/entrypoint.sh
COPY ./nginx.conf /etc/nginx/conf.d/default.conf.template

COPY --from=builder /website/dist /usr/share/nginx/html

ENV EN_HOST localhost
ENV CY_HOST localhost-cy

ENTRYPOINT ["/etc/entrypoint.sh"]
