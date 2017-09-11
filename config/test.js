const server = { host: '127.0.0.1', port: 3004 };
const path = require('path');

module.exports = {
  server,
  mongo: {
    host: 'rp3.redpelicans.com',
    port: 27017,
    database: 'sdmx',
    auto_reconnect: true,
    poolSize: 10,
    w: 1,
    strict: true,
    native_parser: true,
    verbose: true,
  },
};
