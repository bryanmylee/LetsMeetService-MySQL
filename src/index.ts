import express, { Application } from 'express';
import { Server } from 'https';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import Interval from './types/Interval';
import { configureApp, getHttpsServer } from './setup';
import { getEvent, createNewEvent } from './database/eventAccess';
import { createAccessToken, createRefreshToken } from './tokens';

const app: Application = express();
configureApp(app);
const httpsServer: Server = getHttpsServer(app);

app.post('/new', async (req, res, next) => {
  try {
    const body: {
      username: string, passwordHash: string,
      title: string, description: string,
      eventIntervals: {start: string, end: string}[],
    } = req.body;
    const { username, passwordHash, title, description, eventIntervals } = body;
    const parsedIntervals: Interval[] = eventIntervals.map(Interval.fromISO);
    // Insert the event and user into the database
    const { newId, urlId } = await createNewEvent(
        title, description, username, passwordHash, parsedIntervals);
    // Generate access and refresh tokens
    const accessToken = createAccessToken({ username });
    const refreshToken = createRefreshToken({ username });
    res.send({ urlId });
  } catch (err) {
    return next(err);
  }
});

app.get('/:eventId', async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await getEvent(eventId);
    res.send(event);
  } catch (err) {
    return next(err);
  }
});

app.post('/:eventId/login', (req, res) => {
  res.send('Verifying user credentials...');
});

app.post('/:eventId/refresh_token', (req, res) => {
  res.send('Issuing new access and refresh tokens...');
});

app.post('/:eventId/:username/edit', (req, res) => {
  // Check for access token
  const { eventId, username } = req.params;
  res.send(`Updating user: ${username} information on eventId: ${eventId}.`);
});

app.post('/:eventId/:username', (req, res) => {
  const { eventId, username } = req.params;
  res.send(`Adding new user: ${username} on eventId: ${eventId}.`);
});

app.get('/', (_, res) => {
  res.send('LetsMeet Web Service.');
});

httpsServer.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
