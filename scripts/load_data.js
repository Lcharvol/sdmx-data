import { map } from 'ramda';
import initMongo from '../src/mongo';
import config from '../config';
import types from '../data/types.json';
import dataflows from '../data/dataflows.json';

const dropCollection = collection => collection.drop()
  .then(() => {
    console.log(`The collection ${collection.collectionName} is now dropped`);
    return collection;
  })
  .catch(() => {
    console.log(`The collection ${collection.collectionName} can't be dropped...`);
    return collection;
  });

const loadCollection = (data, factory, collection) => {
  const bulk = collection.initializeUnorderedBulkOp();
  map(d => bulk.insert(factory(d)), data);
  return bulk.execute().then(({ nInserted }) =>
    console.log(`The ${collection.collectionName} document is now loaded (${nInserted} lines)`));
};


initMongo({ config }).then(({ db }) => {
  const typesCollection = db.collection('types');
  const dataflowsCollection = db.collection('dataflows');
  const typesFact = type => ({ _id: type.type, avatar: type.avatar });
  const dataflowsFact = dataflow => dataflow;
  return dropCollection(dataflowsCollection)
    .then(() => dropCollection(typesCollection))
    .then(() => loadCollection(types, typesFact, typesCollection))
    .then(() => loadCollection(dataflows, dataflowsFact, dataflowsCollection))
    .then(() => db.close());
}).catch(console.error);
