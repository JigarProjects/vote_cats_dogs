const mysql = require('mysql2/promise');
const fs = require('fs');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

console.log('Starting database setup');

// Initialize Secrets Manager client
const secretClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

console.log('Secrets Manager client initialized with region:', process.env.AWS_REGION || 'us-east-1');

let pool;

async function getDbConfig() {
    const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_SECRET_NAME'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.log('Missing environment variables:', missingVars);
        throw new Error('Missing required database configuration');
    }

    try {
        console.log('Getting database credentials');
        const response = await secretClient.send(
            new GetSecretValueCommand({
                SecretId: process.env.DB_SECRET_NAME
            })
        );

        const secretValue = JSON.parse(response.SecretString);
        
        if (!secretValue.password) {
            console.log('No password found in secret');
            throw new Error('Invalid secret format');
        }

        const config = {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            password: secretValue.password,
            ssl: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
                verifyServerCertificate: false
            },
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };

        secretValue.password = null;
        return config;
    } catch (error) {
        console.log('Error getting credentials:', error);
        throw error;
    }
}

async function initializePool() {
    if (!pool) {
        try {
            console.log('Creating database connection');
            const config = await getDbConfig();
            pool = mysql.createPool(config);
            
            const testConn = await pool.getConnection();
            await testConn.ping();
            testConn.release();
            
            console.log('Database connected');
        } catch (error) {
            console.log('Connection failed:', error);
            throw error;
        }
    }
    return pool;
}

async function executeSchema() {
    let connection;
    try {
        console.log('Running schema');
        connection = await initializePool();
        
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        await connection.query(schema);
        
        console.log('Schema executed');
        return true;
    } catch (error) {
        console.log('Schema error:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
                console.log('Connection closed');
            } catch (error) {
                console.log('Error closing connection:', error);
            }
        }
    }
}

if (require.main === module) {
    console.log('Starting process');
    executeSchema()
        .then(() => {
            console.log('Done');
            process.exit(0);
        })
        .catch(error => {
            console.log('Failed:', error);
            process.exit(1);
        });
}