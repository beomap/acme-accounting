const fs = require('fs');
const path = require('path');

// Load appropriate .env file
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  require('dotenv').config();
}

module.exports = {
  development: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5590', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'task-dev',
  },
  test: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5590', 10),
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'task-test',
  },
  production: {
    dialect: process.env.DB_DIALECT || 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  },
};
