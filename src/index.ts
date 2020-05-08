import express, { Application } from 'express';
import { Server } from 'https';
import bcrypt from 'bcryptjs';

import Interval from './types/Interval';
import { configureApp, getHttpsServer } from './setup';
import database, { client } from './database';
import { DB_DUPLICATE_ENTRY } from './constants';
import { login, getAuthorizationPayload } from './authorization';
import { getRefreshTokenPayload } from './tokens';

const app: Application = express();
configureApp(app);
const httpsServer: Server = getHttpsServer(app);

app.post('/new', async (req, res) => {
  try {
    const { username, password, title, description, eventIntervals }: {
      username: string, password: string,
      title: string, description: string,
      eventIntervals: {start: string, end: string}[]
    } = req.body;
    const parsedIntervals: Interval[] = eventIntervals.map(Interval.fromISO);

    const saltLength = parseInt(process.env.PASSWORD_SALT_LENGTH ?? '12', 10);
    const passwordHash = await bcrypt.hash(password, saltLength);

    const session = await client.getSession();
    const { newId, eventUrl } = await database.createNewEvent(
        session, title, description, username, passwordHash, parsedIntervals);
    await login(session, res, newId, eventUrl, username, true);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  }
});

app.post('/:eventUrl/edit', async (req, res) => {
  try {
    const { eventUrl } = req.params;
    const payload = getAuthorizationPayload(req);
    if (!payload.isAdmin || payload.eventUrl !== eventUrl) {
      throw new Error('Not authorized.');
    }
    res.send({
      message: "Work in progress",
    });
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  }
});

app.post('/:eventUrl/new_user', async (req, res) => {
  try {
    const { eventUrl } = req.params;
    const { username, password, intervals }: {
      username: string, password: string,
      intervals: {start: string, end: string}[]
    } = req.body;
    const parsedIntervals = intervals.map(Interval.fromISO);

    const saltLength = parseInt(process.env.PASSWORD_SALT_LENGTH ?? '12', 10);
    const passwordHash = await bcrypt.hash(password, saltLength);

    const session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    await database.insertNewUser(
        session, eventId, username, passwordHash, parsedIntervals);
    await login(session, res, eventId, eventUrl, username);
  } catch (err) {
    res.status(400);
    const { info } = err;
    if (info?.code === DB_DUPLICATE_ENTRY) {
      res.send({
        error: 'Username already taken.',
        code: info.code,
      });
    }
    res.send({
      error: err.message,
    });
  }
});

app.post('/:eventUrl/login', async (req, res) => {
  try {
    const { eventUrl } = req.params;
    const { username, password }: {
      username: string, password: string,
    } = req.body;

    const session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    const credentials = await database.getUserCredentials(
        session, eventId, username);
    if (credentials === null) throw new Error('User not found.');

    const valid = await bcrypt.compare(password, credentials.passwordHash);
    if (!valid) throw new Error('Password invalid');
    await login(session, res, eventId, eventUrl, username, credentials.isAdmin);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  }
});

app.post('/:eventUrl/logout', async (req, res) => {
  const { eventUrl } = req.params;
  res.clearCookie('refreshToken', { path: `/${eventUrl}/refresh_token` });
  res.send({
    message: 'Logged out',
  });
});

app.post('/:eventUrl/refresh_token', async (req, res) => {
  try {
    const { eventUrl } = req.params;
    const { refreshToken }: { refreshToken: string } = req.cookies;
    if (refreshToken == null) throw new Error('Refresh token not found.');

    // Verify that the token is not tampered with, and retrieve the payload.
    const { username, isAdmin } = getRefreshTokenPayload(refreshToken);

    const session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    const storedRefreshToken = await database.getRefreshToken(
        session, eventId, username);
    if (storedRefreshToken == null) throw new Error('User invalid.');
    if (storedRefreshToken !== refreshToken) {
      throw new Error('Refresh token invalid');
    }
    await login(session, res, eventId, eventUrl, username, isAdmin);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    })
  }
});

app.post('/:eventUrl/:username/edit', (req, res) => {
  try {
    const { eventUrl, username } = req.params;
    const payload = getAuthorizationPayload(req);
    if (payload.eventUrl !== eventUrl || payload.username !== username) {
      throw new Error('Not authorized.');
    }
    res.send({
      message: "Work in progress",
    });
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  }
});

app.get('/:eventUrl', async (req, res) => {
  try {
    const { eventUrl } = req.params;

    const session = await client.getSession();
    const event = await database.getEvent(session, eventUrl);
    res.send(event);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  }
});

app.get('/', (_, res) => {
  res.send('LetsMeet Web Service.');
});

httpsServer.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
