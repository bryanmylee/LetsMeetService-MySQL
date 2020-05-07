import { getClient } from '@mysql/xdevapi';

import { getEvent, createNewEvent } from './eventAccess';
import { setRefreshToken } from './userAccess';

const {
  DB_HOST, DB_NAME, DB_USER, DB_PASS,
  DB_POOL_IDLE, DB_POOL_SIZE, DB_POOL_QUEUE_TIMEOUT
} = process.env;

const connConfig = {
  host: DB_HOST,
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

export const client = getClient(connConfig, poolConfig);

export default ({
  getEvent,
  createNewEvent,
  setRefreshToken,
});