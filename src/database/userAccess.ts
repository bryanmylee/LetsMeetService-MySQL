import Interval from '../types/Interval';

export enum UserType {
  ADMIN,
  DEFAULT,
};

/**
 * Add a new user to an event.
 * @param session The current database session.
 * @param eventId The internal identifier of the event.
 * @param username The username of the new user.
 * @param passwordHash The password hash of the new user.
 * @param intervals The intervals which the user selected.
 * @param userType The type of user account.
 */
export async function insertNewUser(
    session: any, eventId: number, username: string, passwordHash: string,
    intervals: Interval[], userType = UserType.DEFAULT) {
  session.startTransaction();
  try {
    await insertUserDetails(session, eventId, username, passwordHash, userType);
    await insertUserIntervals(session, eventId, username, intervals);
    session.commit();
  } catch (err) {
    session.rollback();
    throw err;
  }
}

/**
 * Insert _shallow_ details of a new user.
 * @param session The current database session.
 * @param eventId The internal identifier of the event.
 * @param username The username of the new user.
 * @param passwordHash The password hash of the new user.
 * @param userType The type of user account.
 */
async function insertUserDetails(
    session: any, eventId: number, username: string, passwordHash: string,
    userType = UserType.DEFAULT) {
  const userTable = session.getSchema('lets_meet').getTable('event_user');
  await userTable
      .insert(['event_id', 'username', 'password', 'is_admin'])
      .values(eventId, username, passwordHash, userType === UserType.ADMIN)
      .execute();
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
  if (length === 0) throw new Error('Empty schedule');
  const userIntervalTable
      = session.getSchema('lets_meet').getTable('user_interval');
  let operation = userIntervalTable
      .insert(['event_id', 'username', 'start_dtime', 'end_dtime']);
  intervals.forEach((interval) => {
    const { start, end } = interval.toSQL();
    operation = operation.values(eventId, username, start, end);
  });
  await operation.execute();
}

/**
 * Update schedule information of a user.
 * @param session The current database session.
 * @param eventId The internal identifier of an event.
 * @param username The username of the user.
 * @param intervals The new schedule information of the user.
 */
export async function updateUserIntervals(
    session: any, eventId: number, username: string, intervals: Interval[]) {
  const { length } = intervals;
  if (length === 0) throw new Error('Empty schedule');
  session.startTransaction();
  try {
    await deleteUserIntervals(session, eventId, username);
    await insertUserIntervals(session, eventId, username, intervals);
    session.commit();
  } catch (err) {
    session.rollback();
    throw err;
  }
}

/**
 * Delete schedule information of a user.
 * @param session The current database session.
 * @param eventId The interval identifier of an event.
 * @param username The username of the user.
 */
async function deleteUserIntervals(
    session: any, eventId: number, username: string) {
  const userIntervalTable
      = session.getSchema('lets_meet').getTable('user_interval');
  userIntervalTable
      .delete()
      .where('event_id = :event_id AND username = :username')
      .bind('event_id', eventId).bind('username', username)
      .execute();
}

/**
 * Get the credentials of a user.
 * @param session The current database session.
 * @param eventId The internal identifier of the event to which the user
 * belongs.
 * @param username The username of the user to find credentials of.
 * @returns A promise that resolves to the password hash of the user account. If
 * the user does not exist, return a promise that resolves to null.
 */
export async function getUserCredentials(
    session: any, eventId: number, username: string) {
  const userTable = session.getSchema('lets_meet').getTable('event_user');
  const rs = await userTable
      .select(['password', 'is_admin'])
      .where('event_id = :event_id AND username = :username')
      .bind('event_id', eventId).bind('username', username)
      .execute();
  let row: [Buffer, boolean];
  if (row = rs.fetchOne()) {
    return ({
      passwordHash: row[0].toString('utf8'),
      isAdmin: row[1],
    });
  }
  return null;
}

/**
 * Get the refresh token of a user stored in database.
 * @param session The current database session.
 * @param eventId The internal identifier of the event to which the user
 * belongs.
 * @param username The username of the user.
 * @returns A promise that resolves to the refresh token of the user.
 */
export async function getRefreshToken(
    session: any, eventId: number, username: string) {
  const userTable = session.getSchema('lets_meet').getTable('event_user');
  const rs = await userTable
      .select(['refresh_token'])
      .where('event_id = :event_id AND username = :username')
      .bind('event_id', eventId).bind('username', username)
      .execute();
  let row: [string];
  if (row = rs.fetchOne()) {
    return row[0];
  }
  return null;
}

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
  const userTable = session.getSchema('lets_meet').getTable('event_user');
  await userTable
      .update()
      .set('refresh_token', refreshToken)
      .where('event_id = :event_id AND username = :username')
      .bind('event_id', eventId).bind('username', username)
      .execute();
}
