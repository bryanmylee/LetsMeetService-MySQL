import mysqlx from '@mysql/xdevapi';

import Interval from './types/Interval';

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

const client = mysqlx.getClient(connConfig, poolConfig);

/**
 * Returns an object describing the event.
 * @param urlId The url identifier of the event
 */
export async function getEvent(urlId: string) {
  const details = await getEventDetails(urlId);
  const { id } = details;
  return ({
    ... await getEventDetails(urlId),
    eventIntervals: await getEventIntervals(id),
    userIntervals: await getEventUserIntervals(id),
  });
}

/**
 * Returns an object containing _shallow_ details of the event.
 * @param urlId The url identifier of the event
 */
async function getEventDetails(urlId: string) {
  const session = await client.getSession();
  const rs = await session
      .sql('CALL get_event_details(?)')
      .bind(urlId).execute();
  const row: [number, string, string, number] = rs.fetchOne();
  const [ id, title, description, dateCreatedInMs ] = row;
  const dateCreated = new Date(dateCreatedInMs);
  return { id, urlId, title, description, dateCreated };
}

/**
 * Returns an array of intervals in which the event is available.
 * @param id The internal identifier of the event
 */
async function getEventIntervals(id: number) {
  const intervals: Interval[] = [];

  const session = await client.getSession();
  const rs = await session
      .sql('CALL get_event_intervals(?)')
      .bind(id).execute();
  let row: [number, number];
  while (row = rs.fetchOne()) {
    const [ start, end ]: Date[] = row.map((ms: number) => new Date(ms));
    intervals.push({ start, end });
  }
  return intervals;
}

/**
 * Returns an object with username keys and their available intervals as values.
 * @param id The internal identifier of the event
 */
async function getEventUserIntervals(id: number) {
  let intervalsByUsername: {[username: string]: Interval[]} = {};

  const session = await client.getSession();
  const rs = await session
      .sql('CALL get_event_users(?)')
      .bind(id).execute();
  let row: [string, number, number];
  while (row = rs.fetchOne()) {
    const [ username, startInMs, endInMs ] = row;
    const interval: Interval = {
      start: new Date(startInMs),
      end: new Date(endInMs),
    }
    intervalsByUsername = {
      ...intervalsByUsername,
      [username]: [
        ...intervalsByUsername[username] ?? [],
        interval,
      ]
    }
  }
  return intervalsByUsername;
}