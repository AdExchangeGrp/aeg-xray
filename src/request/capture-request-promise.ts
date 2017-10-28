import * as URL from 'url';
import RequestDataRequest from './request-data-request';
import { IncomingMessage } from 'http';
import { getCause } from '../http/util';
import * as _ from 'lodash';

export default function captureRequestPromise (module: any): any {

	const getFunc = (uri: any, options: any = {}, callback: any) => {

		let uriResolved: string;

		if (_.isObject(uri)) {

			options = uri;
			uriResolved = uri.uri;

		} else {

			uriResolved = uri;

		}

		const url = URL.parse(uriResolved);
		const host = url.host || 'Unknown host';

		if (!options.headers) {

			options.headers = {};

		}

		if (options.segment) {

			const subSegment = options.segment.addSubSegment(host);
			subSegment.namespace = 'remote';
			options.headers['X-Amzn-Trace-Id'] = 'Root=' + options.segment.traceId + ';Parent=' + options.segment.id +
				';Sampled=' + (options.segment.isSampled ? '1' : '0');

			const result = module.__get(uriResolved, _.isObject(uri) ? uri : options, callback);

			subSegment.addIncomingRequestData = new RequestDataRequest(result);

			result
				.on('error', (err) => {

					subSegment.error = true;
					subSegment.close(err);

				})
				.on('complete', (res: IncomingMessage) => {

					if (res.statusCode === 429) {

						subSegment.throttled = true;

					}

					const cause = getCause(Number(res.statusCode || ''));

					if (cause) {

						subSegment[cause] = true;

					}

					if (subSegment.incomingRequestData) {

						subSegment.incomingRequestData.close(res);

					}

					subSegment.close();

				});

			return result;

		} else {

			return module.__get(uriResolved, _.isObject(uri) ? uri : options, callback);

		}

	};

	module.__get = module.get;
	module.get = getFunc;

	return module;

}
