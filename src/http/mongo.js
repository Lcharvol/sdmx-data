import express from 'express';
import debug from 'debug';
import { map, reduce, toPairs, flatten, compose } from 'ramda';

const logger = debug('sdmx:hhtp');

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

const getRestQuery = lang => ([props, value]) => ({ $or:
  [
    { [`${props}.${lang}`]: new RegExp(value, 'i') },
    { [`${props}`]: new RegExp(value, 'i') },
  ],
});

const getFilteredDataflows = db => (req, res, next) => {
  const collection = db.collection('dataflows');
  const { search, f, ...rest } = req.query;
  const { lang } = req.params;
  let searchParams = [];
  let fieldsValue;
  const restQuery = compose(
    flatten,
    map(getRestQuery(lang)),
    toPairs,
  )(rest);
  // const restQuery = flatten(map(getRestQuery(lang), toPairs(rest)));
  console.log(restQuery);
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

const getPostFilteredDataflows = db => (req, res, next) => {
  const collection = db.collection('dataflows');
  const { search, f, lang, ...rest } = req.body;
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

const initMongo = db => {
  const app = express();
  app
    .get('/types', getMongoData(db, 'types'))
    .get('/dataflows', getMongoData(db, 'dataflows'))
    .get('/groupTypes', getMongoGroupTypes(db))
    .get('/dataflows/:lang/', getFilteredDataflows(db))
    .post('/dataflows', getPostFilteredDataflows(db));
  return app;
};

export default initMongo;
