import { Response, Request } from 'express';

import database from './database';
import { getAccessTokenPayload } from './tokens';

import {
  createAccessToken,
  createRefreshToken,
  setRefreshTokenCookie
} from './tokens';

export function getAuthorizationPayload(req: Request) {
  const { authorization } = req.headers;
  if (!authorization) throw new Error('Authentication not found.');

  // Auth header is in the format: 'Bearer {token}'
  const token = authorization.split(' ')[1];
  return getAccessTokenPayload(token);
}

/**
 * Log a user in and persist the session by storing and sending tokens through
 * cookies and the HTTP/S response.
 * @param session The current database session.
 * @param res The HTTP/S response to set cookies on and send back.
 * @param eventId The internal identifier of the event.
 * @param eventUrl The url identifier of the event.
 * @param username The username of the user logging in.
 */
export async function login(
    session: any, res: Response, eventId: number,
    eventUrl: string, username: string) {
  const accessToken = createAccessToken(eventUrl, username);
  const refreshToken = createRefreshToken(eventUrl, username);

  await database.setRefreshToken(session, eventId, username, refreshToken);

  setRefreshTokenCookie(res, refreshToken, eventUrl);
  res.send({
    eventUrl,
    accessToken,
    accessTokenLifetime: process.env.ACCESS_TOKEN_EXPIRY ?? '15m',
  });
}