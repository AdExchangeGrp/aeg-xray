import { ILogger } from '@adexchange/aeg-logger';

export class Logger {

	private _instance: ILogger;

	public initialize (logger: ILogger) {

		this._instance = logger;

	}

	public debug (message: string, data?: any) {

		if (this._instance) {

			this._instance.debug(message, data);

		}

	}

	public info (message: string, data?: any) {

		if (this._instance) {

			this._instance.info(message, data);

		}

	}

	public warn (message: string, data?: any, error?: Error) {

		if (this._instance) {

			this._instance.warn(message, data, error);

		}

	}

	public error (message: string, data?: any, error?: Error) {

		if (this._instance) {

			this._instance.error(message, data, error);

		}

	}

}

export default new Logger();
