import express, { Application } from 'express';
import cookieParser from 'cookie-parser';
import cors, { CorsOptions } from 'cors';
import fs from 'fs';
import https from 'https';
import http from 'http';

const whitelist = process.env.CLIENT_HOST?.split(',').map((host) =>
    `http://${host}:${process.env.CLIENT_PORT}`);
const corsOptions: CorsOptions = ({
  origin: (origin, callback) => {
    if (whitelist?.includes(origin!) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
});

export function configureApp(app: Application) {
  // Expose simple interface for cookies
  app.use(cookieParser());
  // Control cross-origin resource sharing
  app.use(cors(corsOptions));
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

export function getHttpServer(app: Application) {
  return http.createServer(app);
}