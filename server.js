
import { createBareServer } from '@tomphttp/bare-server-node';
import wisp from 'wisp-server-node';

import express from 'express';
import http from 'http';

import { fileURLToPath } from 'url';
import path from 'path';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'lily', 'index.html'));
});

app.get('/kelsea', (req, res) => {
    res.sendFile(path.join(__dirname, 'kelsea', 'index.html'));
});

app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.use('/wisp/', (req, res) => {
    wisp.routeRequest(req, res);
});

const bareServer = createBareServer('/bare/');
app.use((req, res, next) => {
    if (bareServer.shouldRoute(req)) {
        bareServer.routeRequest(req, res);
    } else {
        next();
    }
});

app.use((req, res) => {
    res.status(404).send('Not found.');
});

const server = http.createServer(app);
server.on('upgrade', (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else if (bareServer.shouldRoute(req)) {
        bareServer.routeUpgrade(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(3000, () => {
    console.log('Server is listening on port 3000');
});