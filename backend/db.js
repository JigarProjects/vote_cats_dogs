const mysql = require('mysql2/promise');
const AWS = require('aws-sdk');

// Initialize Secrets Manager with region from environment
const secretsManager = new AWS.SecretsManager({
    region: process.env.AWS_REGION || 'us-east-1'
});

let pool;

async function getDbConfig() {
    // Validate required environment variables
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_SECRET_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error('Missing required environment variables:', missingVars.join(', '));
        throw new Error('Missing required database configuration');
    }

    try {
        console.log('Fetching database credentials from Secrets Manager');
        const secret = await secretsManager.getSecretValue({
            SecretId: process.env.DB_SECRET_NAME
        }).promise();

        const secretValue = JSON.parse(secret.SecretString);
        
        if (!secretValue.password) {
            console.error('Password not found in secret');
            throw new Error('Invalid secret format: password missing');
        }

        // Create config object with minimal required fields
        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: secretValue.password,
            // Security best practices
            ssl: {
                rejectUnauthorized: true
            },
            // Connection pool settings
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        // Clear sensitive data from memory
        secretValue.password = null;
        
        return config;
    } catch (error) {
        console.error('Error fetching database secret:', error);
        throw new Error('Failed to retrieve database credentials from Secrets Manager');
    }
}

async function initializePool() {
    if (!pool) {
        try {
            const config = await getDbConfig();
            pool = mysql.createPool(config);
            
            // Test the connection
            const testConn = await pool.getConnection();
            await testConn.ping();
            testConn.release();
            
            console.log('Database connection pool initialized successfully');
        } catch (error) {
            console.error('Failed to initialize database connection pool:', error);
            throw error;
        }
    }
    return pool;
}

async function getConnection() {
    try {
        const pool = await initializePool();
        return pool.getConnection();
    } catch (error) {
        console.error('Failed to get database connection:', error);
        throw error;
    }
}

async function getVotes() {
    const connection = await getConnection();
    try {
        const [rows] = await connection.query('SELECT * FROM votes');
        return {
            cats: rows.find(r => r.animal === 'cats').count,
            dogs: rows.find(r => r.animal === 'dogs').count
        };
    } catch (error) {
        console.error('Error fetching votes:', error);
        throw error;
    } finally {
        connection.release();
    }
}

async function updateVote(animal) {
    const connection = await getConnection();
    try {
        await connection.query(
            'UPDATE votes SET count = count + 1 WHERE animal = ?',
            [animal]
        );
        return true;
    } catch (error) {
        console.error('Error updating vote:', error);
        throw error;
    } finally {
        connection.release();
    }
}

module.exports = {
    getVotes,
    updateVote
};
