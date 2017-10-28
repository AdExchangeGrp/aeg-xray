import * as mysql from 'mysql';
import * as config from 'config';
import Segment from '../../src/segment';
import Logger from '../../src/logger';
import logger from '@adexchange/aeg-logger';
import queryWrapper from './query-wrapper';
import samplingRules from '../../src/sampling-rules';
import * as path from 'path';

Logger.initialize(logger);

samplingRules.setSamplingRules(path.join(__dirname, 'config.json'));

describe('Segment', async () => {

	it('Write 100 segments without error', async () => {

		const segment = new Segment('test', {emitProgress: true});
		segment.addMetadata('test', 1, 'debug');

		const rdsConf: any = config.get('aeg-mysql');

		const options = {
			host: rdsConf.host,
			user: rdsConf.user,
			password: rdsConf.password,
			database: 'hitpath',
			insecureAuth: true,
			timezone: 'Z'
		};

		const mysqlConnection = mysql.createConnection(options);

		let i = 0;

		const promises = new Array(100).fill(1).map(() => {

			return queryWrapper(mysqlConnection!, 'SELECT * FROM hits_sales LIMIT 10', segment!, {emitProgress: true});

		});

		await Promise.all(promises);

		await mysqlConnection!.end();
		await segment!.close();

	});

});
