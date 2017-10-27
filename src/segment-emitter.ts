import * as dgram from 'dgram';
import logger from './logger';
import SegmentBase from './segment-base';

const PROTOCOL_HEADER = '{"format": "json", "version": 1}';
const PROTOCOL_DELIMITER = '\n';

export class SegmentEmitter {

	private _port: number;

	private _address: string;

	constructor () {

		if (!process.env.AWS_XRAY_DAEMON_ADDRESS) {

			this._port = 2000;
			this._address = '127.0.0.1';

		} else {

			const parts = process.env.AWS_XRAY_DAEMON_ADDRESS.split(':');

			if (parts.length < 2) {

				throw new Error('AWS_XRAY_DAEMON_ADDRESS invalid: ' + process.env.AWS_XRAY_DAEMON_ADDRESS);

			}

			this._port = Number(parts[1]);
			this._address = parts[0];

		}

	}

	public send (segment: SegmentBase) {

		return new Promise((resolve) => {

			const data = `${PROTOCOL_HEADER}${PROTOCOL_DELIMITER}${segment.format()}`;
			const message = new Buffer(data);
			const short = JSON.stringify({trace_id: segment.traceId, id: segment.id});
			const socket = dgram.createSocket('udp4');

			socket.send(message, 0, message.length, this._port, this._address, (err: any) => {

				if (err) {

					if (err.code === 'EMSGSIZE')

						logger.error(`${segment.type} is too large to send: ${short} (${message.length} bytes).'`);

					else {

						logger.error('Error occurred sending segment: ', err);

					}

				} else {

					logger.debug(`${segment.type} sent: ${segment.format()}`);

				}

				socket.close();

				resolve();

			});

		});

	}

}

export default new SegmentEmitter();
