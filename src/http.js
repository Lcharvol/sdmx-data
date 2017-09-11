import express from 'express';
import http from 'http';
import fs from 'fs';
import { filter, match } from 'ramda';

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
      console.log(req.params);
      // const filteredData = filterData(JSON.parse(data), req.params.lang, req.params.search);
      // res.json(filteredData);
    });
  };

  const promise = new Promise(resolve => {
    app
      .get('/ping', (req, res) => res.json({ ping: 'pong' }))
      .get('/types', getJson('/Users/lcharvol/Documents/sdmx-data/data/types.json'))
      .get('/dataflows/:lang/?search', getFilterdDataflows);
      // .get('/dataflows/:lang', getJson('/Users/lcharvol/Documents/sdmx-data/data/dataflows.json'))
      // .get('/dataflows', getJson('/Users/lcharvol/Documents/sdmx-data/data/dataflows.json'));

    httpServer.listen(port, host, () => {
      resolve({ ...ctx, http: httpServer });
    });
  });
  return promise;
};

export default init;
