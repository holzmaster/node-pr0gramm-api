import * as Types from "../common-types";

export interface APIRequester {
	get<T>(path: string, data?: Types.KeyValue<any>): Promise<T>;
	post<T>(path: string, data?: Types.KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, data: Types.KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, data: Types.KeyValue<any>, ignoreNonce: boolean): Promise<T>
}

export { NodeRequester } from "./node";
