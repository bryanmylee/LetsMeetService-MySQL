import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import fs from 'fs';
import https from 'https';

export function configureApp(app: Application) {
  // Expose simple interface for cookies
  app.use(cookieParser());
  // Control cross-origin resource sharing
  app.use(
    cors({
      origin: `https://localhost:${process.env.CLIENT_PORT}`,
      credentials: true,
    })
  );
  // Support JSON-encoded bodies
  app.use(express.json());
  // Support URL-encoded bodies
  app.use(express.urlencoded({ extended: true }));
}

export function getHttpsServer(app: Application) {
  const key = fs.readFileSync(__dirname + '/../.certs/private.pem', 'utf8');
  const cert = fs.readFileSync(__dirname + '/../.certs/public.pem', 'utf8');
  const passphrase = process.env.SSL_SECRET
  return https.createServer({ key, cert, passphrase }, app);
}