import express, { Application } from 'express';
import { Server } from 'https';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import Interval from './types/Interval';
import { configureApp, getHttpsServer } from './setup';
import { getEvent } from './databaseAccess';
import { createAccessToken, createRefreshToken } from './tokens';

const app: Application = express();
configureApp(app);
const httpsServer: Server = getHttpsServer(app);

app.post('/new', (req, res) => {
  const body: {
    username: string, passwordHash: string,
    title: string, description: string, eventIntervals: Interval[],
  } = req.body;
  // Generate access and refresh tokens
  res.send('Creating a new event.');
});

app.get('/:eventId', (req, res) => {
  const { eventId } = req.params;
  getEvent(eventId)
    .then((event) => {
      res.send(event);
    });
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