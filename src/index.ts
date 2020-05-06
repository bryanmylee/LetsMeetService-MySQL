import express, { Application } from 'express';
import fs from 'fs';
import https, { Server } from 'https';
const key = fs.readFileSync(__dirname + '/../.certs/private.pem', 'utf8');
const cert = fs.readFileSync(__dirname + '/../.certs/public.pem', 'utf8');
const passphrase = process.env.SSL_SECRET

import { getEvent } from './databaseAccess';

const app: Application = express();
const httpsServer: Server = https.createServer({key, cert, passphrase}, app);

app.post('/new', (req, res) => {
  res.send('Creating a new event.');
});

app.get('/:eventId', (req, res) => {
  const { eventId } = req.params;
  getEvent(eventId)
    .then((event) => {
      res.send(JSON.stringify(event));
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
