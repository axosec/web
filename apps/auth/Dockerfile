FROM node:25.2.1-alpine3.23 AS pruner
WORKDIR /app
RUN npm install -g turbo
COPY . .

RUN turbo prune auth --docker

FROM node:25.2.1-alpine3.23 AS builder
WORKDIR /app

RUN npm install -g pnpm@latest

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .

RUN pnpm turbo run build 

FROM nginx:alpine AS runner

COPY --from=builder /app/apps/auth/dist /usr/share/nginx/html

COPY apps/auth/nginx.conf /etc/nginx/conf.d/default.conf

CMD ["nginx", "-g", "daemon off;"]
