import * as should from 'should';
import * as config from 'config';
import Logger from '../../src/logger';
import logger from '@adexchange/aeg-logger';
import samplingRules from '../../src/sampling-rules';
import * as path from 'path';
import captureRequestPromise from '../../src/request/capture-request-promise';
import Segment from '../../src/segment';
import * as BBPromise from 'bluebird';

Logger.initialize(logger);

samplingRules.setSamplingRules(path.join(__dirname, 'config.json'));

let rp: any;
let segment: Segment | undefined;

before(async () => {

	segment = new Segment('test-http');
	rp = captureRequestPromise(require('request-promise'), segment);

});

after(async () => {

	segment!.close();
	await BBPromise.delay(1000);

});

describe('Request Promise', async () => {

	it('Capture successful ', async () => {

		const result = await rp.get('http://stackoverflow.com', {resolveWithFullResponse: true});
		should.exist(result);

	});

	it('Capture successful ', async () => {

		const result = await rp.get({uri: 'http://stackoverflow.com', qs: { test: 1 }, resolveWithFullResponse: true});
		should.exist(result);

	});

	it('Capture Unsuccessful ', async () => {

		try {

			const result = await rp.get('https://security-service-ci.aegcamp.com/v1/oauth/passwordToken?test=1', {resolveWithFullResponse: true});
			should.not.exist(result);

		} catch (ex) {

			// we want it to fail

		}

	});

});
