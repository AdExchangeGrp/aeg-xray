import SqlData from './segment-sql-data';
import * as crypto from 'crypto';
import { RequestData } from './request-data';
import * as StackTrace from 'stacktrace-js';

export default abstract class SegmentBase {

	protected _id: string;

	protected _traceId: string;

	protected _type: string;

	protected _name: string;

	protected _inProgress: boolean;

	protected _startTime: number;

	protected _endTime: number | undefined;

	protected _fault: any;

	protected _error: any;

	protected _cause: any;

	protected _namespace: string | undefined;

	protected _sqlData: SqlData | undefined;

	protected _incomingRequestData?: RequestData;

	protected _metaData: { [key: string]: any };

	protected _throttled: boolean;

	protected _closed: boolean;

	protected _isSampled: boolean;

	constructor (name: string, type: string, isSampled: boolean) {

		this._name = name;
		this._type = type;
		this._id = crypto.randomBytes(8).toString('hex');
		this._startTime = new Date().getTime() / 1000;
		this._inProgress = true;
		this._throttled = false;
		this._fault = false;
		this._error = false;
		this._closed = false;
		this._isSampled = isSampled;
		this._metaData = {};

	}

	get name (): string {

		return this._name;

	}

	get id (): string {

		return this._id;

	}

	get traceId (): string {

		return this._traceId;

	}

	get type (): string {

		return this._type;

	}

	set namespace (ns: string) {

		this._namespace = ns;

	}

	get closed (): boolean {

		return this._closed;

	}

	set throttled (val: boolean) {

		this._throttled = val;

	}

	set fault (val: boolean) {

		this._fault = val;

	}

	set error (val: boolean) {

		this._error = val;

	}

	set addSqlData (sqlData: SqlData) {

		this._sqlData = sqlData;

	}

	set addIncomingRequestData (data: RequestData) {

		this._incomingRequestData = data;

	}

	get incomingRequestData (): RequestData | undefined {

		return this._incomingRequestData;

	}

	get isSampled (): boolean {

		return this._isSampled;

	}

	public addMetadata (key: string, value: any, namespace?: string): void {

		const ns = namespace || 'default';

		if (!this._metaData[ns]) {

			this._metaData[ns] = {};

		}

		this._metaData[ns][key] = value;
	}

	public format (): string {

		return JSON.stringify(this.json());

	}

	public addError (err: Error): void {

		this._fault = true;

		if (!this._cause) {

			this._cause = {
				working_directory: process.cwd(),
				exceptions: []
			};

		}

		this._cause.exceptions.push(err);

	}

	public json (): any {

		const message: any = {
			name: this._name,
			id: this._id,
			trace_id: this._traceId,
			start_time: this._startTime,
			in_progress: this._inProgress,
			fault: this._fault,
			error: this._error,
			throttle: this._throttled,
			metadata: this._metaData
		};

		if (this._endTime) {

			message.end_time = this._endTime;

		}

		if (this._cause) {

			message.cause = {
				working_directory: this._cause.working_directory,
				exceptions: this._cause.exceptions.map((e) => {

					return {

						id: crypto.randomBytes(8).toString('hex'),
						message: e.message,
						stack: StackTrace.getSync(e).map((m) => {

							return {

								path: m.fileName,
								line: m.lineNumber,
								label: m.source

							};

						})

					};

				})

			};

		}

		if (this._sqlData) {

			message.sql = this._sqlData.json();

		}

		if (this._incomingRequestData) {

			message.http = this._incomingRequestData.json();

		}

		if (this._namespace) {

			message.namespace = this._namespace;

		}

		return message;

	}

	public close (err?: Error): void {

		this._close(err);

		this.flush().catch(() => {

			// nothing to do

		});

	}

	public async closeAsync (err?: Error): Promise<void> {

		this._close(err);

		try {

			await this.flush();

		} catch (ex) {

			// nothing to do

		}

	}

	public abstract async flush (): Promise<void>;

	private _close (err?: Error) {

		this._closed = true;
		this._inProgress = false;
		this._endTime = new Date().getTime() / 1000;

		if (err) {

			this.addError(err);

		}

	}

}
