FROM node:20-slim

RUN apt-get update && apt-get install -y \
  git \
  && apt-get clean \

WORKDIR /app

COPY package*.json ./

COPY entrypoint.sh /entrypoint.sh
COPY build-script.js /build-script.js
COPY node_modules /node_modules
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]