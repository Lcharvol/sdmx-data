import should from 'should';
import axios from 'axios';
import config from '../../config';
import run from '../run';

const { describe, it } = global;

const data = {
  types: [
    {
      type: '1',
      avatar: 'a',
    },
    {
      type: '2',
      avatar: 'b',
    },
  ],
  dataflows:[
    {
      type: '1',
    },
    {
      type: '1',
    },
    {
      type: '2',
    },
  ],
}
describe('Pong test', () => {
  it('Should be equal to pong', (done) => {
    run({ config })
      .then(({ http: { url }}) => axios.get(`${url}/ping`))
      .then(({ data: { ping } }) => {
        should(ping).eql('pong');
        done();
      }).catch(done);
  });
});

describe('groupTypes test', () => {
  it('Request should send an 2 a and 1 b', (done) => {
    run({ config, data })
      .then(({ http }) => {
        return axios.get(`${http.url}/groupTypes`)
        .then(({ data }) => {
          should(data).eql({ a: 2, b: 1});
          done();
          http.close();
        })
      })
      .catch(done);
  });
});