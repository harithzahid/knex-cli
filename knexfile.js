import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({path: path.join(__dirname, '.env')});

const config = {
  local: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_LOCAL_CONNECTION_HOST,
      user: process.env.DB_LOCAL_CONNECTION_USER,
      password: process.env.DB_LOCAL_CONNECTION_PASSWORD,
      database: process.env.DB_LOCAL_CONNECTION_DATABASE,
      multipleStatements: true
    },
    cli: {
      secure: false,
      dump: true,
      migrate: true,
      recreate: true,
      replicate: true,
      seed: {
        all: true
      }
    },
    debug: true,
  },
  staging: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_STAGING_CONNECTION_HOST,
      database: process.env.DB_STAGING_CONNECTION_DATABASE,
      user: process.env.DB_STAGING_CONNECTION_USER,
      password: process.env.DB_STAGING_CONNECTION_PASSWORD,
      multipleStatements: true,
    },
    migrations: {
      tableName: 'knex_migrations'
    },
    cli: {
      secure: true,
      dump: true,
      migrate: true,
      recreate: false,
      replicate: false,
      seed: {
        all: false,
        files: ['lookup.js']
      }
    }
  }
};

export default config;
