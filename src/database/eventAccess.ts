import { generateId } from 'gfycat-ids';

import Interval from '../types/Interval';
import { insertNewUser } from './userAccess';
import { DB_DUPLICATE_ENTRY } from '../constants';
import dayjs from 'dayjs';

/**
 * Get the internal identifier of an event.
 * @param session The current database session.
 * @param eventUrl The url identifier to convert.
 * @returns A promise that resolves to the internal identifier of an event.
 */
export async function getId(session: any, eventUrl: string): Promise<number> {
  const eventTable = session.getSchema('lets_meet').getTable('event');
  const rs = await eventTable
      .select(['id'])
      .where('url_id = :url_id')
      .bind('url_id', eventUrl)
      .execute();
  let row: [number];
  if (row = rs.fetchOne()) {
    return row[0];
  }
  throw new Error('Event not found');
}

/**
 * Get details of an event.
 * @param session: The current database session.
 * @param eventUrl The url identifier of the event.
 * @returns A promise that resolves to an object describing an event.
 */
export async function getEvent(session: any, eventUrl: string) {
  const details = await getEventDetails(session, eventUrl);
  const { id } = details;
  return ({
    ...details,
    eventIntervals: await getEventIntervals(session, id),
    userIntervalsByUsername: await getUserIntervalsByUsername(session, id),
  });
}

/**
 * Get _shallow_ details of an event.
 * @param session The current database session.
 * @param eventUrl The url identifier of the event.
 * @returns A promise that resolves to an object containing _shallow_ details of
 * an event.
 */
async function getEventDetails(session: any, eventUrl: string) {
  const eventTable = session.getSchema('lets_meet').getTable('event');
  const rs = await eventTable
      .select(['id', 'title', 'description', 'dtime_created'])
      .where('url_id = :url_id')
      .bind('url_id', eventUrl)
      .execute();
  let row: [number, string, string, number];
  if (row = rs.fetchOne()) {
    const [id, title, description, dateCreatedInMs] = row;
    const dateCreated = dayjs(dateCreatedInMs);
    return { id, eventUrl, title, description, dateCreated };
  }
  throw new Error('Event not found');
}

/**
 * Get the available intervals of an event.
 * @param session The current database session.
 * @param id The internal identifier of the event.
 * @returns A promise that resolves to an array of intervals in which the event
 * is available.
 */
async function getEventIntervals(session: any, id: number) {
  const intervals: Interval[] = [];

  const eventIntervalTable
      = session.getSchema('lets_meet').getTable('event_interval');
  const rs = await eventIntervalTable
      .select(['start_dtime', 'end_dtime'])
      .where('event_id = :event_id')
      .bind('event_id', id)
      .execute();
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
 * @returns A promise that resolves to an object with username keys and their
 * available intervals as values.
 */
async function getUserIntervalsByUsername(session: any, id: number) {
  let intervalsByUsername: {[username: string]: Interval[]} = {};

  const eventIntervalTable
      = session.getSchema('lets_meet').getTable('user_interval');
  const rs = await eventIntervalTable
      .select(['username', 'start_dtime', 'end_dtime'])
      .where('event_id = :event_id')
      .bind('event_id', id)
      .execute();
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
 * @param session: The current database session.
 * @param title The title of the event.
 * @param description The description of the event.
 * @param username The username of the person creating the event.
 * @param passwordHash The password hash of the person creating the event.
 * @param eventIntervals The intervals in which the event is available. By
 * default, the person creating the event will have the same intervals as the
 * event itself.
 * @returns A promise that resolves to an object with the new internal
 * identifier and new url idenfifier.
 */
export async function createNewEvent(
    session: any, title: string, description: string,
    username: string, passwordHash: string, eventIntervals: Interval[]) {
  session.startTransaction();
  try {
    const newId = await insertEventDetails(session, title, description);
    const eventUrl = await updateEventUrl(session, newId);
    await insertEventIntervals(session, newId, eventIntervals);
    await insertNewUser(session, newId, username, passwordHash, eventIntervals);
    session.commit();
    return { newId, eventUrl };
  } catch (err) {
    session.rollback();
    throw err;
  }
}

/**
 * Insert _shallow_ event and user details.
 * @param session The current database session.
 * @param title The title of the event.
 * @param description The description of the event.
 * @param username The username of the person creating the event.
 * @param passwordHash The password hash of the person creating the event.
 * @returns A promise that resolves to an object with the new internal
 * identifier and new url idenfifier.
 */
async function insertEventDetails(
    session: any, title: string, description: string) {
  const schema = session.getSchema('lets_meet');
  const eventTable = schema.getTable('event');
  const newId: number = (await eventTable
    .insert(['title', 'description'])
    .values(title, description)
    .execute()).getAutoIncrementValue();
  return newId;
}

/**
 * Generate and update the url identifier of an event.
 * @param session The current database session.
 * @param eventId The internal identifier of the event.
 * @returns The newly generated url identifier of the event.
 */
async function updateEventUrl(session: any, eventId: number) {
  let numAdjectives = parseInt(process.env.ID_NUM_ADJECTIVES ?? '2', 10);
  let retries = 5;

  const eventTable = session.getSchema('lets_meet').getTable('event');
  while (retries-- > 0) {
    try {
      const eventUrl: string = generateId(eventId, numAdjectives);
      await eventTable
          .update()
          .set('url_id', eventUrl)
          .where('id = :id')
          .bind('id', eventId)
          .execute();
      return eventUrl;
    } catch (err) {
      const { info } = err;
      // On the off chance that a duplicate identifier is generated, increase
      // the number of adjectives used.
      if (info?.code === DB_DUPLICATE_ENTRY) {
        numAdjectives++;
        continue;
      }
      throw err;
    }
  }
  throw new Error('Unable to generate event URL');
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
  const eventIntervalTable
      = session.getSchema('lets_meet').getTable('event_interval');
  let operation = eventIntervalTable
      .insert(['event_id', 'start_dtime', 'end_dtime']);
  eventIntervals.forEach((interval) => {
    const { start, end } = interval.toSQL();
    operation = operation.values(eventId, start, end);
  });
  await operation.execute();
}
