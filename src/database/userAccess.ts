/**
 * Store and associate a refresh token with a user in the database.
 * @param client: The database client.
 * @param eventId The internal identifier of the event to which the user
 * belongs.
 * @param username The username of the user.
 * @param refreshToken The refresh token.
 */
export async function setRefreshToken(
    client: any, eventId: number, username: string, refreshToken: string) {
  const session = await client.getSession();

  await session
      .sql('CALL set_refresh_token(?, ?, ?)')
      .bind([eventId, username, refreshToken]).execute();
}
