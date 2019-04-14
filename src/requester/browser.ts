import * as constants from "../client-constants";
import { APIRequester } from "./index";
import * as Types from "../common-types";
import { createDefaultHeaders, addQueryParams, encodeQueryParams } from "../util";

export class BrowserRequester implements APIRequester {
	private readonly apiUrl = constants.getAPIBaseAddress(false);
	private static readonly headers = createDefaultHeaders();

	public static create(): APIRequester {
		return new BrowserRequester();
	}

	public get<T>(path: string, queryString?: Types.KeyValue<any>): Promise<T> {
		const url = addQueryParams(
			this.apiUrl + path,
			queryString,
		);

		return fetch(
			url, {
				method: "get",
				headers: BrowserRequester.headers,
				credentials: "include",
			}
		).then(processResponse);
	}

	public post<T>(path: string, body: Types.KeyValue<any> = {}, ignoreNonce: boolean = false): Promise<T> {
		const url = this.apiUrl + path;

		if (!ignoreNonce) {
			const meCookie = this.getMeCookie();
			if (meCookie === null || !meCookie.id)
				throw new Error(`Not logged in. The post request to ${path} requires authentication.`);

			body["_nonce"] = meCookie.id.substr(0, 16);
		}

		return fetch(
			url, {
				method: "post",
				headers: BrowserRequester.headers,
				credentials: "include",
				body: encodeQueryParams(body),
			}
		).then(processResponse);
	}

	private getMeCookie(): Types.MeCookie | null {
		const data = parseCookie(document.cookie);
		return "me" in data
			? data.me
			: null;
	}
}

function processResponse(res: Response) {
	if (!res.ok)
		throw new Error(res.statusText);
	return res.json();
}

/**
 * Taken from: https://gist.github.com/rendro/525bbbf85e84fa9042c2#gistcomment-2784930
 */
function parseCookie(value: string) {
	return value
		.split(";")
		.reduce(
			(res, c) => {
				const [key, val] = c.trim()
					.split('=')
					.map(decodeURIComponent);

				try {
					return Object.assign(res, { [key]: JSON.parse(val) });
				} catch (e) {
					return Object.assign(res, { [key]: val });
				}
			},
			{}
		) as { me: Types.MeCookie } | {};
}
