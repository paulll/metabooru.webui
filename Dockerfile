FROM node:21 as static
WORKDIR /assets
COPY . /assets
RUN npm i
RUN npx parcel build view/index.pug

FROM lipanski/docker-static-website:latest
COPY --from=static /assets/dist/ .
CMD ["/busybox", "httpd", "-f", "-v", "-p", "8080", "-c", "httpd.conf"]