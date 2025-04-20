CREATE DATABASE IF NOT EXISTS ${DB_NAME};
USE ${DB_NAME};

CREATE TABLE IF NOT EXISTS ${animal_table} (
    id INT PRIMARY KEY,
    animal VARCHAR(10) NOT NULL,
    count INT DEFAULT 0
);

-- Insert initial data
INSERT INTO ${animal_table} (id, animal, count) VALUES
(1, 'cats', 0),
(2, 'dogs', 0)
ON DUPLICATE KEY UPDATE animal = VALUES(animal); 