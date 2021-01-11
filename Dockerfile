FROM node:14.15.1 as builder

WORKDIR /website

COPY . /website

RUN yarn

ENV NODE_ENV live
ARG CONTENT_SOURCE

ENV EN_SITE "https://\${EN_HOST}/"
ENV CY_SITE "https://\${CY_HOST}/"
ENV CONTENT_SOURCE "${CONTENT_SOURCE}"

RUN yarn generate-site

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
