import * as needle from "needle";
import { PR0GRAMM_BASE_URL, PR0GRAMM_API_PATH } from "../client-constants";
import { APIRequester } from "./index";
import * as Types from "../common-types";
import { createDefaultHeaders, addQueryParams, addApiKeyToHeader } from "../util";

export type Cookies = Record<string, any>;

/**
 * Class used to fire HTTP(S) requests.
 */
export class NodeRequester implements APIRequester {
	private oAuthAccessToken: string | undefined = undefined;

	private readonly apiUrl: string;
	private static readonly headers = createDefaultHeaders();

	/**
	 * @param cookies Pass false to ignore cookies. Pass a CookieJar to use cookies.
	 * @param insecure Use the insecure (non-https) protocol.
	 */
	constructor(
		public cookies: Cookies | false,
		private readonly baseUrl: string,
	) {
		this.apiUrl = baseUrl + PR0GRAMM_API_PATH;
	}

	setOAuthAccessToken(accessToken: string): void {
		this.oAuthAccessToken = accessToken;
	}

	public static create(baseUrl: string = PR0GRAMM_BASE_URL, cookies?: Cookies): APIRequester {
		const cs = !cookies
			? false
			: (cookies ? cookies : {});
		return new NodeRequester(cs as Cookies | false, baseUrl);
	}

	public get<T>(path: string, queryString?: Types.KeyValue<any>): Promise<T> {
		const url = addQueryParams(
			this.apiUrl + path,
			queryString,
		);

		const headers = addApiKeyToHeader(NodeRequester.headers, this.oAuthAccessToken);

		return needle(
			"get",
			url,
			null, {
			cookies: this.cookies || undefined,
			follow_set_cookie: true,
			headers,
			parse_response: "json",
			parse_cookies: true,
		},
		).then(res => {
			if (res.cookies)
				this.cookies = res.cookies;
			if (res.statusCode && 200 <= res.statusCode && res.statusCode < 300)
				return res.body;
			throw new Error(res.statusMessage);
		});
	}

	public post<T>(path: string, body: Types.KeyValue<any> = {}, ignoreNonce: boolean = false): Promise<T> {
		const url = this.apiUrl + path;

		let headers = NodeRequester.headers;

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

		return needle(
			"post",
			url,
			body, {
			cookies: this.cookies || undefined,
			follow_set_cookie: true,
			headers,
			parse_response: "json",
			parse_cookies: true,
			content_type: "application/x-www-form-urlencoded",
		},
		).then(res => {
			if (res.cookies)
				this.cookies = res.cookies;
			if (res.statusCode && 200 <= res.statusCode && res.statusCode < 300)
				return res.body;
			throw new Error(res.statusMessage);
		});
	}

	private getMeCookie(): Types.MeCookie | null {
		const thisCookies = this.cookies;
		if (thisCookies === false)
			return null;
		const cs = thisCookies.getCookies(this.baseUrl);
		for (const c of cs) {
			if (!c) continue;
			// TODO DANGEROUS
			// But there are no good definitions for request's cookies :(
			const ct = c as any as { key: string, value: string };
			if (ct.key === "me") {
				const meCookeStr = decodeURIComponent(ct.value);
				try {
					return JSON.parse(meCookeStr);
				}
				catch (ex) {
					return null;
				}
			}
		}
		return null;
	}
}
