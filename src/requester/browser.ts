import { PR0GRAMM_BASE_URL, PR0GRAMM_API_PATH } from "../client-constants";
import { APIRequester } from "./index";
import * as Types from "../common-types";
import { createDefaultHeaders, addQueryParams, encodeQueryParams, addApiKeyToHeader } from "../util";

export class BrowserRequester implements APIRequester {
	private oAuthAccessToken: string | undefined = undefined;

	private readonly apiUrl: string;
	private static readonly headers = createDefaultHeaders();

	constructor(
		public readonly baseUrl: string,
	) {
		this.apiUrl = baseUrl + PR0GRAMM_API_PATH;
	}

	public static create(baseUrl: string = PR0GRAMM_BASE_URL): APIRequester {
		return new BrowserRequester(baseUrl);
	}

	setOAuthAccessToken(accessToken: string): void {
		this.oAuthAccessToken = accessToken;
	}

	public get<T>(path: string, queryString?: Types.KeyValue<any>): Promise<T> {
		const url = addQueryParams(
			this.apiUrl + path,
			queryString,
		);

		const headers = addApiKeyToHeader(BrowserRequester.headers, this.oAuthAccessToken);

		return fetch(
			url, {
			method: "get",
			headers,
			credentials: "include",
		}).then(processResponse);
	}

	public post<T>(path: string, body: Types.KeyValue<any> = {}, ignoreNonce: boolean = false): Promise<T> {
		const url = this.apiUrl + path;

		let headers = BrowserRequester.headers;

		if (!ignoreNonce) {
			if (this.oAuthAccessToken) {

				headers = addApiKeyToHeader(headers, this.oAuthAccessToken);

			} else {

				// Only try to use the cookie if we don't have an access token
				// Same as here:
				// https://github.com/RundesBalli/pr0gramm-apiCall/blob/e49470faed1bd363c2db4b25f776f6c12d0643a6/apiCall.php#L68-L79
				const meCookie = this.getMeCookie();
				if (meCookie === null || !meCookie.id)
					throw new Error(`Not logged in. The post request to ${path} requires authentication.`);

				body["_nonce"] = meCookie.id.substr(0, 16);
			}
		}

		return fetch(
			url, {
			method: "post",
			headers,
			credentials: "include",
			body: encodeQueryParams(body),
		}).then(processResponse);
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
