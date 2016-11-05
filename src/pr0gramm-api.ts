import * as request from "request";
import * as Response from "./responses";
import * as Types from "./common-types";

class ClientConstants {
	private static readonly VERSION = "1.1.0";
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
	public readonly tags: Pr0grammTagsService;
	public readonly comments: Pr0grammCommentsService;
	public readonly profile: Pr0grammProfileService;
	public readonly contact: Pr0grammContactService;
	public readonly user: Pr0grammUserService;

	private readonly _requester: APIRequester;

	public get cookies(): request.CookieJar { return this._requester.cookies; }
	public set cookies(v: request.CookieJar) { this._requester.cookies = v; }

	constructor(cookies?: request.CookieJar, insecure?: boolean) {
		const req = new APIRequester(cookies ? cookies : request.jar(), !!insecure);
		this._requester = req;
		this.items = new Pr0grammItemsService(req);
		this.tags = new Pr0grammTagsService(req);
		this.comments = new Pr0grammCommentsService(req);
		this.profile = new Pr0grammProfileService(req);
		this.contact = new Pr0grammContactService(req);
		this.user = new Pr0grammUserService(req);
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
				jar: this.cookies,
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

export class Pr0grammCommentsService {
	constructor(private readonly _requester: APIRequester) {
	}

	public delete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/delete`;
		return this._requester.post(path, { id, reason });
	}
	public softDelete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/softDelete`;
		return this._requester.post(path, { id, reason });
	}
	public edit(id: Types.CommentID, newContent: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/edit`;
		return this._requester.post(path, { commentId: id, comment: newContent });
	}

	public vote(id: Types.CommentID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/comments/vote`;
		return this._requester.post(path, { id, vote: absoluteVote, });
	}

	public post(itemId: Types.ItemID, content: string, replyTo: Types.CommentID = 0): Promise<Response.Pr0grammResponse> {
		const path = `/comments/post`;
		return this._requester.post(path, {
			comment: content,
			itemId,
			parentId: replyTo,
		});
	}
}

export class Pr0grammTagsService {
	constructor(private readonly _requester: APIRequester) {
	}

	public add(itemId: Types.ItemID, tags: Types.Tag[]): Promise<Response.Pr0grammResponse> {
		const path = `/tags/add`;
		return this._requester.post(path, {
			itemId,
			tags: APIRequester.createTagList(tags),
			submit: "Tags speichern",
		});
	}

	public delete(itemId: Types.ItemID, banUsers: boolean, days: Types.BanDuration, tags: Types.Tag[]): Promise<Response.Pr0grammResponse> {
		const path = `/tags/delete`;
		return this._requester.post(path, { itemId, tags, banUsers, days });
	}

	public getDetails(itemId: Types.ItemID): Promise<Response.GetDetailsResponse> {
		const path = `/tags/details`;
		return this._requester.get(path, { itemId });
	}

	public vote(id: Types.TagID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/tags/vote`;
		return this._requester.post(path, { id, vote: absoluteVote });
	}
}

export class Pr0grammContactService {
	constructor(private readonly _requester: APIRequester) {
	}

	public send(email: Types.Email, subject: string, message: string): Promise<Response.Pr0grammResponse> {
		const path = `/contact/send`;
		return this._requester.post(path, { email, subject, message });
	}
}

export class Pr0grammUserService {
	constructor(private readonly _requester: APIRequester) {
	}

	public ban(user: Types.Username, reason: string, days: Types.BanDuration): Promise<Response.Pr0grammResponse> {
		const path = `/user/ban`;
		return this._requester.post(path, { user, reason, days });
	}
	public changeEmail(token: Types.ChangeEmailToken): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/changeemail`;
		return this._requester.post(path, { token });
	}
	public changePassword(newPassword: Types.Password): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/changepassword`;
		return this._requester.post(path, { password: newPassword });
	}

	public getFollowList(flags: Types.ItemFlags): Promise<Response.GetFollowListReponse> {
		const path = `/user/followlist`;
		return this._requester.get(path, { flags });
	}

	public getInfo(): Promise<Response.GetUserInfoResponse> {
		const path = `/user/info`;
		return this._requester.get(path);
	}

	public invite(email: Types.Email): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/invite`;
		return this._requester.post(path, { email });
	}

	/**
	 * ????
	 */
	public joinWithInvite(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/joinwithinvite`;
		return this._requester.post(path, { token, email, password, name });
	}
	/**
	 * ????
	 */
	public joinWithToken(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.TokenResponse> {
		const path = `/user/joinwithtoken`;
		return this._requester.post(path, { token, email, password, name });
	}

	public loadInvite(token: Types.InviteToken): Promise<Response.LoadInviteResponse> {
		const path = `/user/loadinvite`;
		return this._requester.get(path, { token });
	}

	public loadPaymentToken(token: Types.PaymentToken): Promise<Response.TokenInfoResponse> {
		const path = `/user/loadpaymenttoken`;
		return this._requester.post(path, { token });
	}

	public login(name: Types.Username, password: Types.Password): Promise<Response.LogInResponse> {
		const path = `/user/login`;
		return this._requester.post(path, { name, password });
	}

	public logout(id: Types.SessionID): Promise<Response.Pr0grammResponse> {
		const path = `/user/logout`;
		return this._requester.post(path, { id });
	}

	/**
	 * ????
	 */
	public redeemToken(token: Types.InviteToken): Promise<Response.TokenResponse> {
		const path = `/user/redeemtoken`;
		return this._requester.post(path, { token });
	}

	public requestEmailChange(newEmail: Types.Email): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/requestemailchange`;
		return this._requester.post(path, { email: newEmail });
	}

	public resetPassword(name: Types.Username, password: Types.Password, token: Types.ChangePasswordToken): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/resetpassword`;
		return this._requester.post(path, { name, password, token });
	}

	public sendPasswordResetMail(email: Types.Email): Promise<Response.Pr0grammResponse> {
		const path = `/user/sendpasswordresetmail`;
		return this._requester.post(path, { email });
	}

	public setSiteSettings(siteSettings: SiteSettingsOptions): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/sitesettings`;
		const options = {
			likesArePublic: siteSettings.likesArePublic,
			showAds: siteSettings.showAds,
			userStatus: "um" + siteSettings.userStatus
		};
		return this._requester.post(path, options);
	}

	public sync(offset: Types.SyncID): Promise<Response.SyncResponse> {
		const path = `/user/sync`;
		return this._requester.get(path, { offset });
	}

	public validate(token: Types.Token): Promise<Response.SuccessableResponse> {
		const path = `/user/validate`;
		return this._requester.post(path, { token });
	}
}

export interface SiteSettingsOptions {
	likesArePublic: boolean;
	showAds: boolean;
	userStatus: Types.UserMark;
}


function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	if (typeof v === "number")
		return v | 0;
	return (v.getTime() / 1000) | 0;
}
