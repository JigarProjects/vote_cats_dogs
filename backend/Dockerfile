FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install --production

ENV AWS_REGION=us-east-1 \
    DB_SECRET_NAME="" \
    DB_HOST="" \
    DB_USER="" \
    DB_NAME=""

EXPOSE 3001
CMD ["node", "server.js"]
