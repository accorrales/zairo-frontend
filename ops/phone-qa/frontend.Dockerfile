FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY angular.json tsconfig*.json ./
COPY src ./src
COPY public ./public
COPY scripts ./scripts
RUN npm run build:phone-qa
FROM node:24-bookworm-slim
WORKDIR /app
COPY --from=build /app/dist/phone-qa/browser ./public
COPY ops/phone-qa/gateway.cjs ./gateway.cjs
RUN chmod -R a+rX /app
USER node
CMD ["node", "gateway.cjs"]
