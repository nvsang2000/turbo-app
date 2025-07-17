FROM oven/bun:alpine

WORKDIR /app

COPY package.json ./

COPY . .

RUN bun install 

RUN bun run build


EXPOSE 35500 35000

CMD ["bun", "run", "dev"]
