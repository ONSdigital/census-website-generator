FROM node:10 as builder

WORKDIR /website

COPY . /website

RUN npm install

ENV NODE_ENV live

RUN npm run generate-site

###############################################################################
# Second Stage
###############################################################################

FROM nginx

COPY --from=builder /website/dist /usr/share/nginx/html
