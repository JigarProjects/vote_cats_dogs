CREATE TABLE IF NOT EXISTS votes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    animal VARCHAR(10) NOT NULL,
    count INT DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO votes (animal) VALUES ('cats');
INSERT INTO votes (animal) VALUES ('dogs');