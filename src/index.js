import debug from 'debug';
import config from '../config';
import boot from './run';

const logger = debug('sdmx');

boot({ config })
  .then(() => logger('Serveur started'))
  .catch(console.error);
