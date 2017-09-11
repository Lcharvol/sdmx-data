import config from '../config';
import boot from './run';

boot({ config })
  .then(() => console.log('serveur started'))
  .catch(console.log('error'));
