import * as config from 'config';
import Segment from '../../src/segment';
import Logger from '../../src/logger';
import logger from '@adexchange/aeg-logger';
import samplingRules from '../../src/sampling-rules';
import * as path from 'path';
import server from './server';
import * as request from 'supertest';

Logger.initialize(logger);

samplingRules.setSamplingRules(path.join(__dirname, 'config.json'));

let app: any = null;

before(async () => {

	app = await server();

});

describe('Segment', async () => {

	it('Capture successful ', async () => {

		await request(app)
			.get('/')
			.set('Accept', 'application/json')
			.expect('Content-Type', /application\/json/)
			.expect(200);

	});

	it('Capture unsuccessful ', async () => {

		await request(app)
			.get('/e')
			.set('Accept', 'application/json')
			.expect('Content-Type', /text\/html/)
			.expect(500);

	});

});

