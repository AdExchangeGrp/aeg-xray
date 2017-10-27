import * as cls from 'continuation-local-storage';

export default class LambdaContext {

	public static get segment (): any {

		const segment = cls.getNamespace('AWSXRay').get('segment');

		if (!segment) {

			throw new Error('Segment does not exist in context');

		}

		segment.resolveLambdaTraceData();
		return segment;
	}

}
