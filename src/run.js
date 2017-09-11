import init from './http';
import initMongo from './mongo';

const run = ctx => init(ctx).then(initMongo(ctx));

export default run;
