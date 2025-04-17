CREATE DATABASE IF NOT EXISTS vote_cats_dogs;
USE vote_cats_dogs;

CREATE TABLE IF NOT EXISTS votes (
    id INT PRIMARY KEY,
    animal VARCHAR(10) NOT NULL,
    count INT DEFAULT 0
);

