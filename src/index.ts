import express, { Application } from 'express';
// import { Server } from 'https';
import { Server } from 'http';

import Interval from './types/Interval';
import { configureApp, getHttpsServer, getHttpServer } from './setup';
import database, { client } from './database';
import { DB_DUPLICATE_ENTRY } from './constants';
import {
  generatePasswordHash,
  comparePasswordHash,
  getAuthorizationPayload,
  login,
} from './authorization';
import { getRefreshTokenPayload } from './tokens';

const app: Application = express();
configureApp(app);
// const httpsServer: Server = getHttpsServer(app);
const httpServer: Server = getHttpServer(app);

// Create a new event.
app.post('/new', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { username, password, title, description, eventIntervals }: {
      username: string, password: string,
      title: string, description: string,
      eventIntervals: {start: string, end: string}[]
    } = req.body;
    const parsedIntervals: Interval[] = eventIntervals.map(Interval.fromISO);
    const passwordHash = await generatePasswordHash(password);
    // Handle database logic.
    session = await client.getSession();
    const { newId, eventUrl } = await database.createNewEvent(
        session, title, description, username, passwordHash, parsedIntervals);
    // Return a response.
    await login(session, res, newId, eventUrl, username, true);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

// Edit an event.
app.post('/:eventUrl/edit', async (req, res) => {
  try {
    // Parse the request.
    const { eventUrl } = req.params;
    const payload = getAuthorizationPayload(req);
    // Verify the request.
    if (!payload.isAdmin || payload.eventUrl !== eventUrl) {
      throw new Error('Not authorized');
    }
    // Return a response.
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

// Add a new user to an event.
app.post('/:eventUrl/new_user', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { eventUrl } = req.params;
    const { username, password, intervals }: {
      username: string, password: string,
      intervals: {start: string, end: string}[]
    } = req.body;
    const parsedIntervals = intervals.map(Interval.fromISO);
    const passwordHash = await generatePasswordHash(password);
    // Handle database logic.
    session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    await database.insertNewUser(
        session, eventId, username, passwordHash, parsedIntervals);
    // Return a response.
    await login(session, res, eventId, eventUrl, username);
  } catch (err) {
    res.status(400);
    const { info } = err;
    if (info?.code === DB_DUPLICATE_ENTRY) {
      res.send({
        error: 'Username already taken',
        code: info.code,
      });
    }
    res.send({
      error: err.message,
    });
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

// Log a user into an event.
app.post('/:eventUrl/login', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { eventUrl } = req.params;
    const { username, password }: {
      username: string, password: string,
    } = req.body;
    // Handle database logic.
    session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    const credentials = await database.getUserCredentials(
        session, eventId, username);
    if (credentials === null) throw new Error('User not found');
    // Verify the request.
    const valid = await comparePasswordHash(password, credentials.passwordHash);
    if (!valid) throw new Error('Password invalid');
    // Return a response.
    await login(session, res, eventId, eventUrl, username, credentials.isAdmin);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

// Log a user of an event.
app.post('/:eventUrl/logout', async (req, res) => {
  // Parse the request.
  const { eventUrl } = req.params;
  res.clearCookie('refreshToken', { path: `/${eventUrl}/refresh_token` });
  // Return a response.
  res.send({
    message: 'Logged out',
  });
});

// Issue new access tokens.
app.post('/:eventUrl/refresh_token', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { eventUrl } = req.params;
    const { refreshToken }: { refreshToken: string } = req.cookies;
    // Verify the request.
    if (refreshToken == null) throw new Error('Refresh token not found');
    // Verify that the token is not tampered with, and retrieve the payload.
    const { username, isAdmin } = getRefreshTokenPayload(refreshToken);
    // Handle database logic.
    session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    const storedRefreshToken = await database.getRefreshToken(
        session, eventId, username);
    if (storedRefreshToken == null) throw new Error('User invalid');
    if (storedRefreshToken !== refreshToken) {
      throw new Error('Refresh token invalid');
    }
    // Return a response.
    await login(session, res, eventId, eventUrl, username, isAdmin);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    })
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

// Edit a user schedule.
app.post('/:eventUrl/:username/edit', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { eventUrl, username } = req.params;
    const payload = getAuthorizationPayload(req);
    const { intervals }: {
      intervals: {start: string, end: string}[]
    } = req.body;
    const parsedIntervals = intervals.map(Interval.fromISO);
    // Verify the request.
    if (payload.eventUrl !== eventUrl || payload.username !== username) {
      throw new Error('Not authorized');
    }
    // Handle database logic.
    session = await client.getSession();
    const eventId = await database.getId(session, eventUrl);
    await database.updateUserIntervals(
        session, eventId, username, parsedIntervals);
    // Return a response.
    res.send({
      message: 'Updated schedule',
    });
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

// Get event details.
app.get('/:eventUrl', async (req, res) => {
  let session;
  try {
    // Parse the request.
    const { eventUrl } = req.params;
    // Handle database logic.
    session = await client.getSession();
    const event = await database.getEvent(session, eventUrl);
    // Return a response.
    res.send(event);
  } catch (err) {
    res.status(400);
    res.send({
      error: err.message,
    });
  } finally {
    if (session) {
      try { session.close() } catch {}
    }
  }
});

app.get('/', (_, res) => {
  res.send('LetsMeet Web Service.');
});

// httpsServer.listen(process.env.PORT, () => {
httpServer.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
