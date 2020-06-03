import { getClient } from '@mysql/xdevapi';
import { Client, Pool, ConnectionConfig } from 'pg';

import { getId, getEvent, createNewEvent } from './eventAccess';
import {
  insertNewUser,
  getUserCredentials,
  getRefreshToken,
  setRefreshToken,
} from './userAccess';

const {
  DB_HOST, DB_PORT, DB_SOCKET, DB_NAME, DB_USER, DB_PASS,
  DB_POOL_IDLE, DB_POOL_SIZE, DB_POOL_QUEUE_TIMEOUT
} = process.env;

const connConfig = {
  host: DB_HOST,
  port: DB_PORT,
  socket: DB_SOCKET,
  schema: DB_NAME,
  user: DB_USER,
  password: DB_PASS,
};

const poolConfig = {
  pooling: {
    enabled: true,
    maxIdleTime: parseInt(DB_POOL_IDLE ?? '3e5', 10),
    maxSize: parseInt(DB_POOL_SIZE ?? '25', 10),
    queueTimeout: parseInt(DB_POOL_QUEUE_TIMEOUT ?? '1e5', 10),
  }
};

/**
 * The client is instantiated once and exported for all routes to access.
 * 
 * Connection sessions are retrieved from the client's connection pool with
 * `.getSession()`.
 */
export const client = getClient(connConfig, poolConfig);

const {
  PGHOST, PGPORT, PGDATABASE, PGUSER, PGPASSWORD
} = process.env;

const pgConnConfig: ConnectionConfig = ({
  host: PGHOST,
  port: parseInt(PGPORT ?? '3211', 10),
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
});

const pool = new Pool(pgConnConfig);

export async function getPool() {
  // await pool.connect();
  return pool;
}

export default ({
  getId,
  getEvent,
  createNewEvent,
  insertNewUser,
  getUserCredentials,
  getRefreshToken,
  setRefreshToken,
});