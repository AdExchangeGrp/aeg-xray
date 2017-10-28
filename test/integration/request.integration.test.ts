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
	rp = captureRequestPromise(require('request'));

});

after(async () => {

	segment!.close();
	await BBPromise.delay(1000);

});

describe('Request', () => {

	it('Capture successful ', (done) => {

		rp.get('http://stackoverflow.com', {segment}, (err, response) => {

			should.exist(response);
			should(response.statusCode).be.equal(200);
			done(err);

		});

	});

	it('Capture Unsuccessful ', (done) => {

		rp.get('https://security-service-ci.aegcamp.com/v1/oauth/passwordToken?test=1', {segment}, (err, response) => {

			should.exist(response);
			should(response.statusCode).be.equal(405);
			done(err);

		});

	});

});
