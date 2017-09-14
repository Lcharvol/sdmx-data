import express from 'express';
import http from 'http';
import debug from 'debug';
import bodyParser from 'body-parser';
import compression from 'compression';
import morgan from 'morgan-debug';
import initFiles from './files';
import initMongo from './mongo';

const logger = debug('sdmx:hhtp');

const getUrl = server => `http://${server.address().address}:${server.address().port}`;

const error = (err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    message: err.toString(),
  });
};

const init = ctx => {
  const { config: { server: { host, port } }, data, db } = ctx;
  const app = express();
  const httpServer = http.createServer(app);

  const promise = new Promise(resolve => {
    app
      .use(bodyParser.urlencoded({ extended: false }))
      .get('/ping', (req, res) => res.json({ ping: 'pong' }))
      .use(compression())
      .use(morgan('sdmx:hhtp', 'dev'))
      .use('/files', initFiles(data))
      .use('/mongo', initMongo(db))
      .use(error);

    httpServer.listen(port, host, () => {
      httpServer.url = getUrl(httpServer);
      logger(`server started on ${httpServer.url}`);
      resolve({ ...ctx, http: httpServer });
    });
  });
  return promise;
};

export default init;
