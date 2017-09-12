const server = { host: '127.0.0.1', port: 3004 };
const path = require('path');

module.exports = {
  server,
  data: {
    types: path.join(__dirname, '../data/types.json'),
    dataflows: path.join(__dirname, '../data/dataflows.json'),
  },
  mongo: {
    host: 'rp3.redpelicans.com',
    port: 27017,
    database: 'sdmx',
    auto_reconnect: true,
    poolSize: 10,
    w: 1,
    strict: false,
    native_parser: true,
    verbose: true,
  },
};
