import jwt, { Secret } from 'jsonwebtoken';
import { Response } from 'express';

export function createAccessToken(
    eventUrl: string, username: string, isAdmin: boolean = false) {
  const payload = {
    evt: eventUrl,
    uid: username,
    adm: isAdmin,
  };
  return jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY ?? '15m' }
  );
}

export function getAccessTokenPayload(token: string) {
  const payload: {
    evt: string,
    uid: string,
    adm: boolean,
  } = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as Secret) as any;
  return {
    eventUrl: payload.evt,
    username: payload.uid,
    isAdmin: payload.adm,
  };
}

export function createRefreshToken(
    eventUrl: string, username: string, isAdmin: boolean = false) {
  const payload = {
    evt: eventUrl,
    uid: username,
    adm: isAdmin,
  };
  return jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET as Secret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? '7d' }
  );
}

export function getRefreshTokenPayload(token: string) {
  const payload: {
    evt: string,
    uid: string,
    adm: boolean,
  } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as Secret) as any;
  return {
    eventUrl: payload.evt,
    username: payload.uid,
    isAdmin: payload.adm,
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