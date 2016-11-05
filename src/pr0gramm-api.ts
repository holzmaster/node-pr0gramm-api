import * as request from "request";
import * as Response from "./responses";
import * as Types from "./common-types";
// import * as qs from "querystring";

class ClientConstants {
	private static readonly VERSION = "1.0.0";
	private static readonly PROTOCOL_PREFIX = "https://";
	private static readonly PROTOCOL_PREFIX_INSECURE = "http://";
	private static readonly HOST_NAME = "pr0gramm.com";

	public static getBaseAddress(insecure?: boolean): string {
		return (insecure ? ClientConstants.PROTOCOL_PREFIX_INSECURE : ClientConstants.PROTOCOL_PREFIX) + ClientConstants.HOST_NAME;
	}
	public static getAPIBaseAddress(insecure: boolean): string {
		return ClientConstants.getBaseAddress(insecure) + "/api";
	}

	public static getUserAgent() {
		return `pr0gramm-api/${ClientConstants.VERSION} (Node.js)`;
	}
}

export class Pr0grammAPI {

	public readonly items: Pr0grammItemsService;
	private readonly _requester: APIRequester;

	public get cookies(): request.CookieJar { return this._requester.cookies; }
	public set cookies(v: request.CookieJar) { this._requester.cookies = v; }

	constructor(cookies?: request.CookieJar, insecure?: boolean) {
		const req = new APIRequester(cookies ? cookies : request.jar(), !!insecure);
		this._requester = req;
		this.items = new Pr0grammItemsService(req);
	}
}

export class APIRequester {
	private readonly _apiUrl: string;
	private static readonly _headers = APIRequester.createDefaultHeaders();

	constructor(public cookies: request.CookieJar, insecure: boolean) {
		this._apiUrl = ClientConstants.getAPIBaseAddress(insecure);
	}

	public get<T>(path: string, data?: Types.KeyValue<any>): Promise<T> {
		const url = this._apiUrl + path;
		return new Promise<T>((resolve, reject) => {
			request.get(url, {
				qs: data || {},
				headers: APIRequester._headers,
				json: true,
			}, (err, response, body) => {
				if (err)
					return reject(err);
				if (response.statusCode === 200)
					return resolve(body);
			});
		});
	}
	public post<T>(path: string, data?: Types.KeyValue<any>): Promise<T> {
		const url = this._apiUrl + path;
		// TODO: _nonce and stuff
		throw "Not implemented :(";
	}
	public static createTagList(tags: Types.Tag[]): Types.TagList {
		return tags.join(",");
	}

	private static createDefaultHeaders() {
		return {
			"User-Agent": ClientConstants.getUserAgent()
		};
	}
}

export class Pr0grammItemsService {
	constructor(private readonly _requester: APIRequester) {
	}

	public delete(options: DeleteItemOptions): Promise<Response.Pr0grammResponse> {
		const path = `/items/delete`;
		return this._requester.post(path, options);
	}

	public getInfo(itemId: Types.ItemID): Promise<Response.GetItemsInfoResponse> {
		const path = `/items/info`;
		return this._requester.get(path, { itemId });
	}

	public getItems(options: GetItemsOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = Pr0grammItemsService.parseRawGetItemsOptions(options);
		return this._requester.get<Response.GetItemsResponse>(path, rawOptions);
	}
	public getItemsNewer(options: GetItemsNewerOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = Object.assign({
			newer: options.newer,
		}, Pr0grammItemsService.parseRawGetItemsOptions(options));
		return this._requester.get(path, rawOptions);
	}
	public getItemsOlder(options: GetItemsOlderOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = Object.assign({
			older: options.older,
		}, Pr0grammItemsService.parseRawGetItemsOptions(options));
		return this._requester.get(path, rawOptions);
	}
	public getItemsAround(options: GetItemsAroundOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = Object.assign({
			id: options.around,
		}, Pr0grammItemsService.parseRawGetItemsOptions(options));
		return this._requester.get(path, rawOptions);
	}

	private static parseRawGetItemsOptions(options: GetItemsOptions) {
		return {
			flags: options.flags,
			promoted: options.promoted ? 1 : 0,

			self: options.self ? 1 : 0,
			tags: options.tags ? APIRequester.createTagList(options.tags) : undefined,
			user: options.user,
			likes: options.likes,
		};
	}

	public vote(id: Types.ItemID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/items/vote`;
		const data = {
			id,
			vote: absoluteVote,
		};
		return this._requester.post(path, data);
	}
	public rateLimited(): Promise<Response.Pr0grammResponse> {
		const path = `/items/ratelimited`;
		return this._requester.post(path);
	}

	// TODO:
	// items/post
	// items/info
}

export interface DeleteItemOptions {
	itemId: Types.ItemID;
	days: number;
	banUser: boolean;
	notifyUser: boolean;
	reason: Types.DeleteItemReason;
	customReason: string;
}

export interface GetItemsOptions {
	flags: Types.ItemFlags;
	promoted: boolean;

	self?: boolean;
	tags?: Types.Tag[];
	user?: Types.Username;
	likes?: Types.Likes;
}
export interface GetItemsNewerOptions extends GetItemsOptions {
	newer: Types.ItemID;
}
export interface GetItemsOlderOptions extends GetItemsOptions {
	older: Types.ItemID;
}
export interface GetItemsAroundOptions extends GetItemsOptions {
	around: Types.ItemID;
}

export class Pr0grammProfileService {
	constructor(private readonly _requester: APIRequester) {
	}

	public getCommentsBefore(name: Types.Username, flags: Types.ItemFlags, before: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		const path = `/profile/comments`;
		return this._requester.get(path, {
			name,
			flags,
			before: ensureUnixTimetamp(before),
		});
	}
	public getCommentsAfter(name: Types.Username, flags: Types.ItemFlags, after: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		const path = `/profile/comments`;
		return this._requester.get(path, {
			name,
			flags,
			after: ensureUnixTimetamp(after),
		});
	}

	public follow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		const path = `/profile/follow`;
		return this._requester.post(path, { name });
	}
	public unfollow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		const path = `/profile/unfollow`;
		return this._requester.post(path, { name });
	}

	public getInfo(name: Types.Username, flags: Types.ItemFlags): Promise<Response.GetProfileInfoResponse> {
		const path = `/profile/info`;
		return this._requester.get(path, { name, flags });
	}
}

function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	if (typeof v === "number")
		return v | 0;
	return (v.getTime() / 1000) | 0;
}
