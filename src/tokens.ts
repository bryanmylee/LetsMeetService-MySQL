import jwt, { Secret } from 'jsonwebtoken';
import { Response } from 'express';

export function createAccessToken(payload: {[key: string]: string}) {
  return jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRY ?? '15m' }
  );
}

export function createRefreshToken(payload: {[key: string]: string}) {
  return jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET as Secret,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRY ?? '7d' }
  );
}

/**
 * Store a refresh token as a protected cookie on the client.
 * @param res The response to send to the client.
 * @param refreshToken The refresh JWT.
 * @param eventUrl The url identifier of the event this token is for.
 */
export function setRefreshTokenCookie(
    res: Response, refreshToken: string, eventUrl: string) {
  res.cookie('refresh', refreshToken, {
    httpOnly: true,
    path: `/${eventUrl}/refresh_token`,
  });
}