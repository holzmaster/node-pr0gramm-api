import { Agent } from "http";
import * as constants from "../client-constants";
import { APIRequester } from "./index";
import * as Types from "../common-types";
import { CookieJar, jar as createCookieJar, get as getRequest, post as postRequest } from "request";
import { createDefaultHeaders } from "../util";

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
		public cookies: CookieJar | false,
		private readonly insecure: boolean,
		private readonly pool?: Agent,
	) {
		this.apiUrl = constants.getAPIBaseAddress(insecure);
	}

	public static create(insecure?: boolean, cookies?: CookieJar): APIRequester {
		const cs = !cookies
			? false
			: (cookies ? cookies : createCookieJar());
		return new NodeRequester(cs as CookieJar | false, !!insecure);
	}

	public get<T>(path: string, data?: Types.KeyValue<any>): Promise<T> {
		const url = this.apiUrl + path;
		return new Promise((resolve, reject) => {
			getRequest(url, {
				pool: this.pool,
				qs: data || {},
				headers: NodeRequester.headers,
				jar: this.cookies,
				json: true,
			}, (err, response, body) => {
				if (err) return reject(err);
				if (response.statusCode === 200) return resolve(body);
			});
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

		return new Promise((resolve, reject) => {
			postRequest(url, {
				pool: this.pool,
				form: body,
				headers: NodeRequester.headers,
				jar: this.cookies,
				json: true,
			}, (err, response, body) => {
				if (err) return reject(err);
				if (response.statusCode === 200) return resolve(body);
			});
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
