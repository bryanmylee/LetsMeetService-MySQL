import express from 'express';

const app: express.Application = express();

app.get('/', (_, res) => {
    res.send('Hello world!');
});

app.listen(3000, () => {
    console.log('Listening on port 3000');
});
