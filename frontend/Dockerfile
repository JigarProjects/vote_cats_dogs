FROM node:18-alpine

WORKDIR /app
COPY . .
RUN npm install --production

ENV PORT=3000
ENV MIDDLEWARE_URL=http://middleware:3001
EXPOSE 3000

CMD ["node", "server.js"]
