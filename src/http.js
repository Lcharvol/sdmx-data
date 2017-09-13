import express from 'express';
import http from 'http';
import debug from 'debug';
import { map, reduce, toPairs, flatten } from 'ramda';
import compression from 'compression';
import morgan from 'morgan-debug';
import initFiles from './files';

const logger = debug('sdmx:hhtp');

const getUrl = server => `http://${server.address().address}:${server.address().port}`;

const error = (err, req, res, next) => {
  console.log(err.stack);
  res.status(500).json({
    message: err.toString(),
  });
};

const getMongoData = (db, coll) => (req, res, next) => {
  const collection = db.collection(coll);
  collection.find({}).toArray((err, docs) => {
    if (err) return next(err);
    logger('Found types in mongodb');
    res.json(docs);
  });
};

const getSearchParams = lang => searchValue => ({ $or:
  [
    { [`name.${lang}`]: new RegExp(searchValue, 'i') },
    { [`description.${lang}`]: new RegExp(searchValue, 'i') },
  ],
});

const getRestQuery = lang => ([props, searchValue]) => ({ $or:
  [
    { [`${props}.${lang}`]: new RegExp(searchValue, 'i') },
    { [`${props}`]: new RegExp(searchValue, 'i') },
  ],
});

const getFilteredDataflows = db => (req, res, next) => {
  const collection = db.collection('dataflows');
  const { search, f, ...rest } = req.query;
  const { lang } = req.params;
  let searchParams = [];
  let fieldsValue;
  const restQuery = flatten(map(getRestQuery(lang), toPairs(rest)));
  if (search) {
    const searchValues = search.indexOf(',') >= 0 ? search.split(',') : [search];
    searchParams = map(getSearchParams(lang), searchValues);
  }
  if (f) {
    fieldsValue = f.indexOf(',') >= 0 ? f.split(',') : [f];
  }
  const query = { $and: [...searchParams, ...restQuery] };
  collection.find(query, fieldsValue).toArray((err, docs) => {
    if (err) return next(err);
    logger('Found dataflows in mongodb');
    res.json(docs);
  });
};

const loadTypes = db => db.collection('types').find().toArray();

const loadDataflows = db => db.collection('dataflows').aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]).toArray();

const getMongoGroupTypes = db => (req, res) => {
  const promises = [loadTypes(db), loadDataflows(db)];
  Promise.all(promises)
    .then(([types, dataflows]) => {
      const reducedTypes = reduce(
        (acc, { _id, avatar }) => (
          { ...acc, [_id]: avatar }), {}, types,
      );
      res.json(map(dataflow => ({ avatar: reducedTypes[dataflow._id], count: dataflow.count }), dataflows));
    });
};

const initMongo = db => {
  const app = express();
  app
    .get('/types', getMongoData(db, 'types'))
    .get('/dataflows', getMongoData(db, 'dataflows'))
    .get('/groupTypes', getMongoGroupTypes(db))
    .get('/dataflows/:lang/', getFilteredDataflows(db));
  return app;
};

const init = ctx => {
  const { config: { server: { host, port } }, data, db } = ctx;
  const app = express();
  const httpServer = http.createServer(app);

  const promise = new Promise(resolve => {
    app
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
