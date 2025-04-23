const mysql = require('mysql2/promise');
const fs = require('fs');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize Secrets Manager client
const secretClient = new SecretsManagerClient({
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
        const response = await secretClient.send(
            new GetSecretValueCommand({
                SecretId: process.env.DB_SECRET_NAME
            })
        );

        const secretValue = JSON.parse(response.SecretString);
        
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
            ssl: {
                rejectUnauthorized: false,
                minVersion: 'TLSv1.2',
                verifyServerCertificate: false
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

async function executeSchema() {
    let connection;
    try {
        console.log('Starting schema execution');
        connection = await initializePool();
        
        // Read and execute schema.sql
        console.log('Reading schema.sql file');
        const schema = fs.readFileSync('./schema.sql', 'utf8');
        
        console.log('Executing schema statements');
        await connection.query(schema);
        
        console.log('Schema executed successfully');
        return true;
    } catch (error) {
        console.error('Error executing schema:', error);
        throw error;
    } finally {
        if (connection) {
            try {
                await connection.end();
                console.log('Database connection closed');
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
}

// For direct execution
if (require.main === module) {
    console.log('Starting schema execution process');
    executeSchema()
        .then(() => {
            console.log('Schema execution completed successfully');
            process.exit(0);
        })
        .catch(error => {
            console.error('Schema execution failed:', error);
            process.exit(1);
        });
}