# Production image for Zeabur.
# Runtime MUST execute the Nitro node-server bundle.
# `npx vite preview` is forbidden here: Vite blocks public hosts (HTTP 403
# "This host is not allowed") and the runtime stage has no vite/node_modules.
FROM node:22-bookworm-slim AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV NITRO_PRESET=node-server
ENV NODE_ENV=production
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /src
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=8080
COPY --from=build /src/.output ./.output
EXPOSE 8080
# PID 1 = Nitro. Do not add vite, npx, or preview in this stage.
ENTRYPOINT ["node"]
CMD [".output/server/index.mjs"]
