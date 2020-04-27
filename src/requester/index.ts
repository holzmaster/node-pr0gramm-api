import { KeyValue } from "../common-types";

export interface APIRequester {
	get<T>(path: string, queryString?: KeyValue<any>): Promise<T>;
	post<T>(path: string, body?: KeyValue<any>, ignoreNonce?: boolean): Promise<T>;
	post<T>(path: string, body: KeyValue<any>, ignoreNonce?: boolean): Promise<T>;
	post<T>(path: string, body: KeyValue<any>, ignoreNonce: boolean): Promise<T>;

	setOAuthAccessToken(key: string): void;
}

export { NodeRequester } from "./node";
export { BrowserRequester } from "./browser";
