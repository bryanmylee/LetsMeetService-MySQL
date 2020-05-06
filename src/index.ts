import express from 'express';

import { getEvent } from './databaseAccess';

const app: express.Application = express();

app.post('/new', (req, res) => {
  res.send('Creating a new event.');
});

app.get('/:eventId', (req, res) => {
  const { eventId } = req.params;
  res.send(`eventId: ${eventId}`);
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

app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
  getEvent('GraciousSnarlingHorse').then(res => console.log(res));
});
