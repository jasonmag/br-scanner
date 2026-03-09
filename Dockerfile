FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV DECODER_PORT=8000
ENV BARCODE_DECODER_URL=http://127.0.0.1:8000
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 python3-pip libzbar0 wget \
  && rm -rf /var/lib/apt/lists/*
COPY decoder_service/requirements.txt ./decoder_service/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r ./decoder_service/requirements.txt
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/decoder_service ./decoder_service
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD ["sh", "./scripts/healthcheck.sh"]
CMD ["sh", "./scripts/start-with-decoder.sh"]
