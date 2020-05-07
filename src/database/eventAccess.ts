import mysqlx from '@mysql/xdevapi';
import { generateId } from 'gfycat-ids';

import Interval from '../types/Interval';
import dayjs, { Dayjs } from 'dayjs';

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
  const session = await client.getSession();
  const details = await getEventDetails(session, urlId);
  const { id } = details;
  return ({
    ... details,
    eventIntervals: await getEventIntervals(id, session),
    userIntervals: await getEventUserIntervals(id, session),
  });
}

/**
 * Returns an object containing _shallow_ details of the event.
 * @param urlId The url identifier of the event
 */
async function getEventDetails(session: any, urlId: string) {
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
async function getEventIntervals(session: any, id: number) {
  const intervals: Interval[] = [];

  const rs = await session
      .sql('CALL get_event_intervals(?)')
      .bind(id).execute();
  let row: [number, number];
  while (row = rs.fetchOne()) {
    const [ startInMs, endInMs ]: number[] = row;
    intervals.push(Interval.fromUnixTimestamp({
      start: startInMs,
      end: endInMs,
    }));
  }
  return intervals;
}

/**
 * Returns an object with username keys and their available intervals as values.
 * @param id The internal identifier of the event
 */
async function getEventUserIntervals(session: any, id: number) {
  let intervalsByUsername: {[username: string]: Interval[]} = {};

  const rs = await session
      .sql('CALL get_event_users(?)')
      .bind(id).execute();
  let row: [string, number, number];
  while (row = rs.fetchOne()) {
    const [ username, startInMs, endInMs ] = row;
    const interval = Interval.fromUnixTimestamp({
      start: startInMs,
      end: endInMs,
    });
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

export async function createNewEvent(
    title: string, description: string,
    username: string, passwordHash: string, eventIntervals: Interval[]) {
  const session = await client.getSession();
  const { newId, urlId } = await insertEventDetails(
      session, title, description, username, passwordHash);
  await insertEventIntervals(session, newId, eventIntervals);
  return { newId, urlId };
}

async function insertEventDetails(
    session: any, title: string, description: string,
    username: string, passwordHash: string) {
  const rs = await session
      .sql('CALL create_new_event(?, ?, ?, ?)')
      .bind([title, description, username, passwordHash]).execute();
  const newId: number = rs.fetchOne()[0];
  const urlId: string = generateId(newId, 3);
  await session
      .sql('CALL update_url_id(?, ?)')
      .bind([newId, urlId]).execute();
  return { newId, urlId };
}

async function insertEventIntervals(
    session: any, eventId: number, eventIntervals: Interval[]) {
  const { length } = eventIntervals;
  if (length === 0) return;
  const sqlQuery =
      'INSERT INTO event_interval (event_id, start_dtime, end_dtime) VALUES '
      + '(?, ?, ?),'.repeat(length - 1) + '(?, ?, ?)';
  const params = eventIntervals.flatMap((interval: Interval) => {
    const { start, end } = interval.toSQL();
    return [eventId, start, end];
  })
  await session.sql(sqlQuery).bind(params).execute();
  console.log(sqlQuery);
}