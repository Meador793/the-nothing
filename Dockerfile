FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
ENV THE_NOTHING_TRANSPORT=http PORT=3000 HOST=0.0.0.0
EXPOSE 3000
USER node
CMD ["node", "src/index.js"]
