import express from 'express';
import fs from 'fs';
import debug from 'debug';
import { filter, match, reduce, propOr } from 'ramda';

const logger = debug('sdmx:hhtp');

const getGroupTypes = data => (req, res) => {
  const { types, dataflows } = data;
  const reducedTypes = reduce(
    (acc, { type, avatar }) => (
      { ...acc, [type]: avatar }), {}, types,
  );
  const groupType = reduce(
    (acc, dataflow) => {
      const avatar = reducedTypes[dataflow.type];
      acc[avatar] = propOr(0, avatar, acc) + 1;
      return acc;
    }, {}, dataflows);
  logger('groupTypes loaded');
  res.json(groupType);
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

const getJson = path => (req, res, next) => {
  fs.readFile(path, 'utf8', (err, data) => {
    if (err) return next(err);
    res.json(JSON.parse(data));
  });
};

const init = data => {
  const app = express();
  app
    .get('/types', getJson('/Users/lcharvol/Documents/sdmx-data/data/types.json'))
    .get('/dataflows/:lang/', getFilterdDataflows)
    .get('/groupTypes', getGroupTypes(data));
  return app;
};

export default init;
