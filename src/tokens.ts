import jwt, { Secret } from 'jsonwebtoken';

export function createAccessToken(payload: {[key: string]: string}) {
  return jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_SECRET as Secret,
      { expiresIn: '15m' }
  );
}

export function createRefreshToken(payload: {[key: string]: string}) {
  return jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_SECRET as Secret,
      { expiresIn: '7d' }
  );
}