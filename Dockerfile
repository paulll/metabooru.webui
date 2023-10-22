FROM oven/bun:alpine as static
WORKDIR /assets
COPY . /assets
RUN bunx parcel build

FROM lipanski/docker-static-website:latest
COPY --from=static /assets/dist/ .
RUN /busybox httpd -f -v -p 8080 -c httpd.conf