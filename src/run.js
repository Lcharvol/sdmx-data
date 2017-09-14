import initHttp from './http/index';
import initData from './data';
import initMongo from './mongo';

const run = ctx => initData(ctx).then(initMongo).then(initHttp);

export default run;
