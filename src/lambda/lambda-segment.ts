import LambdaContext from '../lambda/lambda-context';
import Segment from '../segment';
import logger from '../logger';

export default class LambdaSegment extends Segment {

	constructor () {

		super('facade');

		const segment = LambdaContext.segment;

		if (segment) {

			logger.debug('XRAY sdk context segment found');
			this._id = segment.id;
			this._traceId = segment.trace_id;
			this._startTime = segment.start_time;

		} else {

			const trace = LambdaContext.processTraceHeader();

			if (!trace.Root || !trace.Parent) {

				logger.warn('XRAY trace header not found in Lambda context');

			} else {

				logger.debug('XRAY trace header found', trace);
				this._id = trace.Parent;
				this._traceId = trace.Root;

			}

		}

		this._isSampled = true;

	}

	public async flush (): Promise<void> {

		await this._flushSubSegments(true);

	}

	public close () {

		this._closed = true;

		this.flush().catch(() => {

			// nothing to do

		});

	}

	public async closeAsync () {

		this._closed = true;

		await this.flush();

	}

}
