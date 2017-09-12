import mongodb from 'mongodb';
import debug from 'debug';
import express from 'express';

const logger = debug('sdmx:mongo');

const getTypes = (req, res) => res.json({ test: 'test' });

export const initMongo = (data) => {
  const app = express();
  app
    .get('/types', getTypes);
  return app;
};

const init = ctx => {
  const { config: { mongo } } = ctx;
  const server = new mongodb.Server(mongo.host, mongo.port, mongo);
  const dbconnector = new mongodb.Db(mongo.database, server, mongo);
  return dbconnector.open().then(db => {
    logger('mongo ready for U...');
    return { ...ctx, db };
  });
};

export default init;
