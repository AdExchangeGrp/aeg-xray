import * as cls from 'continuation-local-storage';
import * as _ from 'lodash';

export interface IAmazonTraceHeader {
	Root?: string;
	Parent?: string;
	Sampled?: boolean;
}

const NAMESPACE = 'AWSXRay';

export class LambdaContext {

	public get segment (): any | undefined {

		if (!cls.getNamespace(NAMESPACE)) {

			return;

		}

		const segment = cls.getNamespace(NAMESPACE).get('segment');

		if (segment) {

			segment.resolveLambdaTraceData();

		}

		return segment;
	}

	/**
	 * X-Amzn-Trace-Id: Root=1-5759e988-bd862e3fe1be46a994272793;Parent=53995c3f42cd8ad8;Sampled=1
	 */
	public processTraceHeader (): IAmazonTraceHeader {

		if (!process.env._X_AMZN_TRACE_ID) {

			return {};

		}

		const parts = process.env._X_AMZN_TRACE_ID.split(';');

		return _.reduce<string, IAmazonTraceHeader>(parts, (m, header) => {

			const pair = header.split('=');
			const key = pair[0].trim();
			let val: string | boolean = pair[1].trim();

			if (key === 'Sampled') {

				val = !!+val;

			}

			m[key] = val;

			return m;

		}, {});
	}

}

export default new LambdaContext();
