FROM node:20-alpine

# Install Chromium dan dependencies-nya
RUN apk add --no-cache \
    chromium \
    font-noto \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tetapkan path Chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY . /app

WORKDIR /app

RUN yarn install --frozen-lockfile

CMD ["node", "src/index.js"]
