import { generateId } from 'gfycat-ids';

import Interval from '../types/Interval';

/**
 * Get details of an event.
 * @param client: The database client.
 * @param urlId The url identifier of the event.
 * @returns An object describing an event.
 */
export async function getEvent(client: any, urlId: string) {
  const session = await client.getSession();

  const details = await getEventDetails(session, urlId);
  const { id } = details;
  return ({
    ...details,
    eventIntervals: await getEventIntervals(session, id),
    userIntervals: await getEventUserIntervals(session, id),
  });
}

/**
 * Get _shallow_ details of an event.
 * @param session The current database session.
 * @param urlId The url identifier of the event.
 * @returns An object containing _shallow_ details of an event.
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
 * Get the available intervals of an event.
 * @param session The current database session.
 * @param id The internal identifier of the event.
 * @returns An array of intervals in which the event is available.
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
 * Get user schedule information of an event.
 * @param session The current database session.
 * @param id The internal identifier of the event.
 * @returns An object with username keys and their available intervals as
 * values.
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

/**
 * Insert a new event into the database.
 * @param client: The database client.
 * @param title The title of the event.
 * @param description The description of the event.
 * @param username The username of the person creating the event.
 * @param passwordHash The password hash of the person creating the event.
 * @param eventIntervals The intervals in which the event is available. By
 * default, the person creating the event will have the same intervals as the
 * event itself.
 * @returns An object with the new internal identifier and new url idenfifier.
 */
export async function createNewEvent(
    client: any, title: string, description: string,
    username: string, passwordHash: string, eventIntervals: Interval[]) {
  const session = await client.getSession();

  const { newId, urlId } = await insertEventAndUserDetails(
      session, title, description, username, passwordHash);
  await insertEventIntervals(session, newId, eventIntervals);
  await insertUserIntervals(session, newId, username, eventIntervals);
  return { newId, urlId };
}

/**
 * Insert _shallow_ event and user details.
 * @param session The current database session.
 * @param title The title of the event.
 * @param description The description of the event.
 * @param username The username of the person creating the event.
 * @param passwordHash The password hash of the person creating the event.
 * @returns An object with the new internal identifier and new url idenfifier.
 */
async function insertEventAndUserDetails(
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

/**
 * Insert available intervals of an event.
 * @param session The current database session.
 * @param eventId The internal identifier of an event.
 * @param eventIntervals The available intervals of the event.
 */
async function insertEventIntervals(
    session: any, eventId: number, eventIntervals: Interval[]) {
  const { length } = eventIntervals;
  if (length === 0) return;
  const query =
      'INSERT INTO event_interval (event_id, start_dtime, end_dtime) VALUES '
      + '(?, ?, ?),'.repeat(length - 1) + '(?, ?, ?)';
  const params = eventIntervals.flatMap((interval: Interval) => {
    const { start, end } = interval.toSQL();
    return [eventId, start, end];
  });
  await session.sql(query).bind(params).execute();
}

/**
 * Insert schedule information of a user.
 * @param session The current database session.
 * @param eventId The internal identifier of an event.
 * @param username The username of the user.
 * @param intervals The schedule information of the user.
 */
async function insertUserIntervals(
    session: any, eventId: number, username: string, intervals: Interval[]) {
  const { length } = intervals;
  if (length === 0) return;
  const query =
      'INSERT INTO user_interval (event_id, username, start_dtime, end_dtime) VALUES '
      + '(?, ?, ?, ?),'.repeat(length - 1) + '(?, ?, ?, ?)';
  const params = intervals.flatMap((interval: Interval) => {
    const { start, end } = interval.toSQL();
    return [eventId, username, start, end];
  });
  await session.sql(query).bind(params).execute();
}