FROM node:24-bookworm-slim AS build
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/* && npm install -g pnpm@11.11.0
COPY . .
ENV HUSKY=0
RUN --mount=type=cache,id=starter-pnpm,target=/pnpm/store pnpm install --frozen-lockfile --store-dir /pnpm/store --network-concurrency 8 --child-concurrency 2
RUN pnpm -r --workspace-concurrency=1 build

FROM build AS api
ENV NODE_ENV=production
USER node
EXPOSE 3001
CMD ["pnpm", "--filter", "@starter/api", "start"]

FROM build AS web
ENV NODE_ENV=production
ENV PORT=3000
RUN chown -R node:node /app/apps/web/.next
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@starter/web", "start"]
