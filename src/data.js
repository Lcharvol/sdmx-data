import debug from 'debug';
import fs from 'fs';
import { map, toPairs, fromPairs } from 'ramda';

const logger = debug('sdmx:data');

const loadFile = (name, path) => {
  const promise = new Promise((res, rej) => {
    fs.readFile(path, 'utf-8', (err, data) => {
      if (err) return rej(err);
      logger(`The ${name} file is now loaded`);
      res([name, JSON.parse(data)]);
    });
  });
  return promise;
};

const loadData = files => Promise.all(
  map(([name, path]) => loadFile(name, path), toPairs(files)),
);

const init = ctx => {
  const { config: { data } } = ctx;
  if (!data) return Promise.resolve(ctx);
  return loadData(data).then(res => ({ ...ctx, data: fromPairs(res) }));
};

export default init;
