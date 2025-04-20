#!/bin/sh

# Get database credentials from AWS Secrets Manager
if [ -n "$DB_SECRET_NAME" ]; then
    echo "Fetching database credentials from AWS Secrets Manager..."
    SECRET=$(aws secretsmanager get-secret-value --secret-id $DB_SECRET_NAME --region $AWS_REGION --query SecretString --output text)
    export DB_PASSWORD=$(echo $SECRET | jq -r .password)
fi

# Run Flyway migrations
flyway migrate 