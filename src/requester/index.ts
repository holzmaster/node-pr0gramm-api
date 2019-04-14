import * as constants from "../client-constants";
import * as Types from "../common-types";

export interface APIRequester {
	get<T>(path: string, data?: Types.KeyValue<any>): Promise<T>;
	post<T>(path: string, data?: Types.KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, data: Types.KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, data: Types.KeyValue<any>, ignoreNonce: boolean): Promise<T>
}

export function createDefaultHeaders() {
	return {
		"User-Agent": constants.getUserAgent()
	};
}
