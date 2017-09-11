import should from 'should';
import axios from 'axios';
import config from '../../config';
import run from '../run';

const { describe, it } = global;

describe('Ping test', () => {
  it('Request should send an object with a ping key et a pong value', rep => {
    const pong = run({ config }).then(() => axios.get('hhtp://localhost:3004/ping'))
    .then(({ data: { ping }}) => {
      should(ping).eql('pong');
      rep();
    })
    .catch(rep)
  });
});