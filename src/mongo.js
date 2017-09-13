import mongodb from 'mongodb';
import debug from 'debug';
import express from 'express';

const logger = debug('sdmx:mongo');

const getMongoData = (db, coll) => (req, res) => {
  const collection = db.collection(coll);
  collection.find({}).toArray((err, docs) => {
    if (err) throw err;
    logger('Found types in mongodb');
    res.json(docs);
  });
};

const getFilteredDataflows = db => (req, res) => {
  const collection = db.collection('dataflows');
  const { search } = req.query;
  const { lang } = req.params;
  collection.find({ name: { lang: search } }).toArray((err, docs) => {
    if (err) throw err;
    logger('Found dataflows in mongodb');
    res.json(docs);
  });
};

export const initMongo = db => {
  const app = express();
  app
    .get('/types', getMongoData(db, 'types'))
    .get('/dataflows/:lang/', getFilteredDataflows(db))
    .get('/dataflows', getMongoData(db, 'dataflows'));
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
