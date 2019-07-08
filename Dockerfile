FROM node:10 as builder

WORKDIR /website

COPY . /website

RUN npm install

ENV NODE_ENV live

ENV EN_SITE "https://\${EN_HOST}/"
ENV CY_SITE "https://\${CY_HOST}/"
ENV NI_SITE "https://\${NI_HOST}/"

RUN npm run generate-site

###############################################################################
# Second Stage
###############################################################################

FROM nginx

COPY ./entrypoint.sh /etc/entrypoint.sh
COPY ./nginx-default.conf /etc/nginx/conf.d/default.conf.template
COPY ./nginx-cy.conf /etc/nginx/conf.d/cy.conf.template
COPY ./nginx-ni.conf /etc/nginx/conf.d/ni.conf.template

COPY --from=builder /website/dist /usr/share/nginx/html

ENV EN_HOST localhost-en
ENV CY_HOST localhost-cy
ENV NI_HOST localhost-ni

ENTRYPOINT ["/etc/entrypoint.sh"]
