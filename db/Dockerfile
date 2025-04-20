FROM flyway/flyway:9-alpine

WORKDIR /flyway

# Copy migration files and configuration
COPY migrations/ ./migrations/
COPY flyway.conf ./conf/

# Set environment variables (these will be overridden by ECS task definition)
ENV DB_HOST="" \
    DB_USER="" \
    DB_PASSWORD="" \
    DB_NAME="vote_cats_dogs"

# The entrypoint is already set in the base image
# It will use the flyway command to run migrations 