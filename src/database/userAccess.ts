import Interval from '../types/Interval';
import { getId } from './eventAccess';

/**
 * Store and associate a refresh token with a user in the database.
 * @param session: The current database session.
 * @param eventId The internal identifier of the event to which the user
 * belongs.
 * @param username The username of the user.
 * @param refreshToken The refresh token.
 */
export async function setRefreshToken(
    session: any, eventId: number, username: string, refreshToken: string) {
  await session
      .sql('CALL set_refresh_token(?, ?, ?)')
      .bind([eventId, username, refreshToken]).execute();
}

/**
 * Add a new user to an event.
 * @param session The current database session.
 * @param eventUrl The url identifier of the event.
 * @param username The username of the new user.
 * @param passwordHash The password hash of the new user.
 * @param intervals The intervals which the user selected.
 * @returns The internal identifier of the event.
 */
export async function insertNewUser(
    session: any, eventUrl: string, username: string, passwordHash: string,
    intervals: Interval[]) {
  const eventId = await getId(session, eventUrl);
  await insertNewUserDetails(session, eventId, username, passwordHash);
  await insertUserIntervals(session, eventId, username, intervals);
  return eventId;
}

async function insertNewUserDetails(
    session: any, eventId: number, username: string, passwordHash: string) {
  await session
      .sql('CALL insert_new_user(?, ?, ?)')
      .bind([eventId, username, passwordHash]).execute();
}

/**
 * Insert schedule information of a user.
 * @param session The current database session.
 * @param eventId The internal identifier of an event.
 * @param username The username of the user.
 * @param intervals The schedule information of the user.
 */
export async function insertUserIntervals(
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
