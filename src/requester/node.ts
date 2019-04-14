import * as needle from "needle";
import * as constants from "../client-constants";
import { APIRequester } from "./index";
import * as Types from "../common-types";
import { createDefaultHeaders, addQueryParams } from "../util";

export type Cookies = Record<string, any>;

/**
 * Class used to fire HTTP(S) requests.
 */
export class NodeRequester implements APIRequester {
	private readonly apiUrl: string;
	private static readonly headers = createDefaultHeaders();

	/**
	 * @param cookies Pass false to ignore cookies. Pass a CookieJar to use cookies.
	 * @param insecure Use the insecure (non-https) protocol.
	 */
	constructor(
		public cookies: Cookies | false,
		private readonly insecure: boolean,
	) {
		this.apiUrl = constants.getAPIBaseAddress(insecure);
	}

	public static create(insecure?: boolean, cookies?: Cookies): APIRequester {
		const cs = !cookies
			? false
			: (cookies ? cookies : {});
		return new NodeRequester(cs as Cookies | false, !!insecure);
	}

	public get<T>(path: string, queryString?: Types.KeyValue<any>): Promise<T> {
		const url = addQueryParams(
			this.apiUrl + path,
			queryString,
		);

		return needle(
			"get",
			url,
			null, {
				cookies: this.cookies || undefined,
				follow_set_cookie: true,
				headers: NodeRequester.headers,
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

		if (!ignoreNonce) {
			const meCookie = this.getMeCookie(this.insecure);
			if (meCookie === null || !meCookie.id)
				throw new Error(`Not logged in. The post request to ${path} requires authentication.`);

			body["_nonce"] = meCookie.id.substr(0, 16);
		}

		return needle(
			"post",
			url,
			body, {
				cookies: this.cookies || undefined,
				follow_set_cookie: true,
				headers: NodeRequester.headers,
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

	private getMeCookie(insecure: boolean): Types.MeCookie | null {
		const addr = constants.getBaseAddress(insecure);
		const thisCookies = this.cookies;
		if (thisCookies === false)
			return null;
		const cs = thisCookies.getCookies(addr);
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
