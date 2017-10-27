import * as crypto from 'crypto';
import * as _ from 'lodash';
import segmentEmitter from './segment-emitter';
import logger from './logger';
import SubSegment from './sub-segment';
import SegmentBase from './segment-base';
import sampler, { Sampler } from './sampler';
import LambdaContext from './lambda/lambda-context';

export default class Segment extends SegmentBase {

	public static fromLambdaContext (options: { emitProgress?: boolean } = {}): Segment {

		const lambda = LambdaContext.segment();
		const segment = new Segment(lambda.name, options);
		segment._traceId = lambda.traceId;
		segment._id = lambda.id;
		segment._startTime = lambda.start_time;
		return segment;

	}

	private _subSegments: SubSegment[];

	private _subSegmentSampler: Sampler;

	constructor (name: string, options: { emitProgress?: boolean } = {}) {

		super(name, 'segment', sampler.isSampled(name));

		this._traceId = `1-${Math.round(new Date().getTime() / 1000).toString(16)}-${crypto.randomBytes(12).toString('hex')}`;
		this._subSegments = [];
		this._subSegmentSampler = new Sampler();

		if (options.emitProgress && this._isSampled) {

			segmentEmitter.send(this).catch(() => {

				// nothing to do here, already logged

			});

		}

	}

	get subSegmentSampler (): Sampler {

		return this._subSegmentSampler;

	}

	public json (): any {

		const message = super.json();

		if (this._subSegments.length) {

			message.subsegments = this._subSegments.map((s) => s.json());

		}

		return message;

	}

	public addSubSegment (name: string, options: { emitProgress?: boolean } = {}): SubSegment {

		if (this.closed) {

			throw new Error('Cannot add sub-segment to closed segment');

		}

		const subSegment = new SubSegment(name, this);
		subSegment.namespace = 'remote';
		this._subSegments.push(subSegment);

		if (options.emitProgress && this._isSampled && subSegment.isSampled) {

			segmentEmitter.send(subSegment).catch(() => {

				// nothing to do here, already logged

			});

		}

		this._flushSubSegments(false).catch(() => {

			// nothing to do here, already logged

		});

		return subSegment;

	}

	public async flush (): Promise<void> {

		await this._flushSubSegments(true);

		if (this._isSampled) {

			await segmentEmitter.send(this);

		}

	}

	private async _flushSubSegments (force: boolean): Promise<void> {

		const self = this;

		_.remove(self._subSegments, (r) => {

			return !r.isSampled;

		});

		// if any sub-segments are open, we just flush them out... they should have been closed
		// we only want to flush closed segments when new ones are added to an open segment
		const toProcess = force ? this._subSegments : _.filter(this._subSegments, (f) => f.closed);

		const promises = _.reduce<SubSegment, Array<Promise<void>>>(toProcess, (m, s) => {

			m.push(_flush(s));
			return m;

		}, []);

		await Promise.all(promises);

		async function _flush (s: SubSegment): Promise<void> {

			try {

				if (self._isSampled && s.isSampled) {

					await segmentEmitter.send(s);

				}

			} catch (ex) {

				logger.error('Error flushing xray segments', ex);

			}

			_.remove(self._subSegments, (r) => {

				return r.id === s.id;

			});

		}

	}

}
