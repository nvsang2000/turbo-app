FROM oven/bun:latest AS pruner
WORKDIR /app
COPY . .
RUN bunx turbo@^1.9.3 prune form-pdf-ui --docker

FROM oven/bun:latest AS build
WORKDIR /app

# Copy pruned metadata and install deps
COPY --from=pruner /app/out/json ./
RUN rm -f bun.lock bun.lockb package-lock.json yarn.lock pnpm-lock.yaml
RUN bun install


# Copy pruned source
COPY --from=pruner /app/out/full ./

# ✅ FIX: Restore vite.config.ts manually (pruned out)
COPY apps/form-pdf-ui/vite.config.ts /app/apps/form-pdf-ui/vite.config.ts

WORKDIR /app/apps/form-pdf-ui
RUN bun run build

FROM oven/bun:latest AS runner
WORKDIR /app

COPY --from=build /app/apps/form-pdf-ui .

EXPOSE 35500
CMD ["bun", "run", "preview"]
