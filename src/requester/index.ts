import { KeyValue } from "../common-types";

export interface APIRequester {
	get<T>(path: string, queryString?: KeyValue<any>): Promise<T>;
	post<T>(path: string, body?: KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, body: KeyValue<any>, ignoreNonce?: boolean): Promise<T>
	post<T>(path: string, body: KeyValue<any>, ignoreNonce: boolean): Promise<T>
}

export { NodeRequester } from "./node";
export { BrowserRequester } from "./browser";
