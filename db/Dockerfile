FROM node:18-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Add a script to execute schema.sql
RUN echo '#!/bin/sh\n\
node index.js\n\
if [ $? -eq 0 ]; then\n\
  echo "Schema execution completed successfully"\n\
  exit 0\n\
else\n\
  echo "Schema execution failed"\n\
  exit 1\n\
fi' > /app/entrypoint.sh && chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"] 