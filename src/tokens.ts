import jwt, { Secret } from 'jsonwebtoken';
import { Response } from 'express';
import { createNewEvent } from './database/eventAccess';

export function createAccessToken(eventUrl: string, username: string) {
  const payload = {
    evt: eventUrl,
    uid: username,
  };
  return jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY ?? '15m' }
  );
}

export function createRefreshToken(eventUrl: string, username: string) {
  const payload = {
    evt: eventUrl,
    uid: username,
  };
  return jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET as Secret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? '7d' }
  );
}

export function getAccessTokenPayload(token: string) {
  const payload: {
    evt: string,
    uid: string,
  } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as any;
  return {
    eventUrl: payload.evt,
    username: payload.uid,
  };
}

export function getRefreshTokenPayload(token: string) {
  const payload: {
    evt: string,
    uid: string,
  } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as Secret) as any;
  return {
    eventUrl: payload.evt,
    username: payload.uid,
  };
}

/**
 * Store a refresh token as a protected cookie on the client.
 * @param res The response to send to the client.
 * @param refreshToken The refresh JWT.
 * @param eventUrl The url identifier of the event this token is for.
 */
export function setRefreshTokenCookie(
    res: Response, refreshToken: string, eventUrl: string) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    path: `/${eventUrl}/refresh_token`,
  });
}