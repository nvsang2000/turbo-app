# Stage 1: Prune dependencies for the 'editor-service' workspace
FROM oven/bun:latest AS pruner
WORKDIR /app
# Copy entire monorepo for pruning context
COPY . .
# Prune to only editor-service workspace and its dependencies
RUN bunx turbo@^1.9.3 prune editor-service --docker

# Stage 2: Install production dependencies
FROM oven/bun:latest AS dependencies
WORKDIR /app
# Copy only pruned package metadata for install
COPY --from=pruner /app/out/json ./
# Remove existing lockfiles to avoid devDependency issues
RUN rm -f bun.lock bun.lockb package-lock.json yarn.lock pnpm-lock.yaml
# Install production dependencies (from pruned package.json)
RUN bun install --production

# Stage 3: Runtime
FROM oven/bun:latest AS runner
WORKDIR /app
# Set production environment
ENV NODE_ENV=production
ENV PORT=35000
# Copy installed modules
COPY --from=dependencies /app/node_modules ./node_modules
# Copy pruned source code
COPY --from=pruner /app/out/full ./
# Switch to editor-service directory
WORKDIR /app/apps/editor-service
# Expose editor-service port
EXPOSE 35000
# Run the editor-service directly (bun can execute TypeScript at runtime)
CMD ["bun", "src/server.ts"]
