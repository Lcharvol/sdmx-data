import express from 'express';
import http from 'http';
import fs from 'fs';
import { filter, match, assoc, map, dissoc, groupBy } from 'ramda';

const init = ctx => {
  const { config: { server: { host, port } } } = ctx;
  const app = express();
  const httpServer = http.createServer(app);

  const getJson = path => (req, res, next) => {
    fs.readFile(path, 'utf8', (err, data) => {
      if (err) return next(err);
      res.json(JSON.parse(data));
    });
  };

  const isMatching = (search, lang) => data => {
    if ((match(search, data.name[`${lang}`]).length || match(search, data.description[`${lang}`]).length) > 0) {
      return true;
    }
    return false;
  };

  const filterData = (lang, search, dataflows) => {
    const data = filter(isMatching(search, lang), dataflows);
    return {
      numFound: data.length,
      searchValue: search,
      lang,
      dataflows: data,
    };
  };

  const getFilterdDataflows = (req, res, next) => {
    fs.readFile('/Users/lcharvol/Documents/sdmx-data/data/dataflows.json', 'utf8', (err, data) => {
      if (err) return next(err);
      const { search } = req.query;
      const { lang } = req.params;
      const filteredData = filterData(lang, search, JSON.parse(data));
      res.json(filteredData);
    });
  };

  const countTypes = (dataflows, types) => {
    const groupedData = groupBy(dataflow => dataflow.type, dataflows);
    const newTypes = types;
    newTypes.map((type) => {
      type.count = groupedData[`${type.type}`].length;
    });
    return newTypes;
  };

  const addCount = data => map(assoc('count', 0), JSON.parse(data));

  const formateGroupeTypes = type => {
    const ret = type;
    ret.type = ret.avatar;
    return dissoc('avatar', ret);
  };

  const getGroupeTypes = (req, res, next) => {
    fs.readFile('/Users/lcharvol/Documents/sdmx-data/data/types.json', 'utf8', (err, data) => {
      if (err) return next(err);
      const types = addCount(data);
      fs.readFile('/Users/lcharvol/Documents/sdmx-data/data/dataflows.json', 'utf8', (err2, data2) => {
        if (err2) return next(err2);
        const dataflows = JSON.parse(data2);
        const ret = countTypes(dataflows, types).map(formateGroupeTypes);
        res.json(ret);
      });
    });
  };

  const promise = new Promise(resolve => {
    app
      .get('/ping', (req, res) => res.json({ ping: 'pong' }))
      .get('/types', getJson('/Users/lcharvol/Documents/sdmx-data/data/types.json'))
      .get('/dataflows/:lang/', getFilterdDataflows)
      .get('/groupeTypes', getGroupeTypes);

    httpServer.listen(port, host, () => {
      resolve({ ...ctx, http: httpServer });
    });
  });
  return promise;
};

export default init;
