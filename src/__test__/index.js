import config from '../../config';
import boot from '../run';
import axios from 'axios';

axios.get('/ping')
.then(function (response) {
  console.log('ceci est une reponse: ', response);
})
.catch(function (error) {
  console.log('cest une erreur: ', error);
});