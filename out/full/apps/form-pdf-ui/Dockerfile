# —— Stage 1: Prune workspace form-pdf-ui —— 
FROM oven/bun:latest AS pruner
WORKDIR /app
COPY . .
RUN bunx turbo@^1.9.3 prune form-pdf-ui --docker

# —— Stage 2: Install & Build —— 
FROM oven/bun:latest AS build
WORKDIR /app
# 1) Copy metadata đã prune
COPY --from=pruner /app/out/json ./
RUN bun install --locked
# 2) Copy code đã prune
COPY --from=pruner /app/out/full ./
WORKDIR /app/apps/form-pdf-ui
RUN bun run build

# —— Stage 3: Serve with Nginx —— 
FROM nginx:alpine AS runner
# Xoá nội dung cũ
RUN rm -rf /usr/share/nginx/html/*
# Copy build output đúng folder (build/public trong trường hợp của bạn)
COPY --from=build /app/apps/form-pdf-ui/build/public /usr/share/nginx/html
EXPOSE 35500
CMD ["nginx", "-g", "daemon off;"]
