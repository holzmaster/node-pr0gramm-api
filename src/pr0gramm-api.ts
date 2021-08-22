
import * as Response from "./responses";
import * as Types from "./common-types";
import { APIRequester } from "./requester";
import { ensureUnixTimetamp, createTagList } from "./util";

/**
 * A set of APIs to interact with pr0gramm. Its design is based on the API the site uses.
 *
 * If you don't need the whole API, you can instantiate the services yourself (e. g. Pr0grammItemsService).
 */
export class Pr0grammAPI {

	public readonly items: Pr0grammItemsService;
	public readonly tags: Pr0grammTagsService;
	public readonly messages: Pr0grammMessageService;
	public readonly comments: Pr0grammCommentsService;
	public readonly profile: Pr0grammProfileService;
	public readonly contact: Pr0grammContactService;
	public readonly user: Pr0grammUserService;

	private constructor(
		public readonly requester: APIRequester,
	) {
		this.items = new Pr0grammItemsService(requester);
		this.tags = new Pr0grammTagsService(requester);
		this.messages = new Pr0grammMessageService(requester);
		this.comments = new Pr0grammCommentsService(requester);
		this.profile = new Pr0grammProfileService(requester);
		this.contact = new Pr0grammContactService(requester);
		this.user = new Pr0grammUserService(requester);
	}

	public static create(requester: APIRequester): Pr0grammAPI {
		return new Pr0grammAPI(requester);
	}
}


export class Pr0grammItemsService {
	constructor(private readonly requester: APIRequester) {
	}

	public delete(options: DeleteItemOptions): Promise<Response.Pr0grammResponse> {
		const path = `/items/delete`;
		return this.requester.post(path, options);
	}

	public getInfo(itemId: Types.ItemID): Promise<Response.GetItemsInfoResponse> {
		const path = `/items/info`;
		return this.requester.get(path, { itemId });
	}

	public getItems(options: GetItemsOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = Pr0grammItemsService.parseRawGetItemsOptions(options);
		return this.requester.get(path, rawOptions);
	}
	public getItemsNewer(options: GetItemsNewerOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = {
			newer: options.newer,
			...Pr0grammItemsService.parseRawGetItemsOptions(options)
		};
		return this.requester.get(path, rawOptions);
	}
	public getItemsOlder(options: GetItemsOlderOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = {
			older: options.older,
			...Pr0grammItemsService.parseRawGetItemsOptions(options)
		};
		return this.requester.get(path, rawOptions);
	}
	public getItemsAround(options: GetItemsAroundOptions): Promise<Response.GetItemsResponse> {
		const path = `/items/get`;
		const rawOptions = {
			id: options.around,
			...Pr0grammItemsService.parseRawGetItemsOptions(options)
		};
		return this.requester.get(path, rawOptions);
	}

	public walkStreamNewer(options: GetItemsNewerOptions): AsyncIterableIterator<Types.Item> {
		return this.walkStream(
			options.newer,
			options, {
			getNextId: res => res.items[res.items.length - 1].id,
			shouldContinue: res => !res.atStart,
			getItems: (opts, currentId) => this.getItemsNewer({ ...opts, newer: currentId }),
		}
		);
	}
	public walkStreamOlder(options: GetItemsOlderOptions): AsyncIterableIterator<Types.Item> {
		return this.walkStream(
			options.older,
			options, {
				getNextId: res => res.items[res.items.length - 1].id,
				shouldContinue: res => !res.atEnd,
				getItems: (opts, currentId) => this.getItemsOlder({ ...opts, older: currentId }),
			}
		);
	}

	public async *walkStream(start: Types.ItemID, options: GetItemsOptions, functions: WalkStreamFunctions): AsyncIterableIterator<Types.Item> {
		const fns = { ...functions }; // defensive copy

		let currentId = start;
		let lastCurrentId: Types.ItemID;

		let response: Response.GetItemsResponse | null = null;
		do {
			response = await fns.getItems(options, currentId);

			const items = response.items;
			if (!items || items.length <= 0)
				break;

			yield* items;

			lastCurrentId = currentId;
			currentId = fns.getNextId(response);

			if (lastCurrentId === currentId)
				break;

		} while (fns.shouldContinue(response));
	}

	private static parseRawGetItemsOptions(options: GetItemsOptions) {
		return {
			flags: options.flags,
			promoted: options.promoted ? 1 : 0,

			self: options.self ? 1 : 0,
			tags: options.tags ? createTagList(options.tags) : undefined,
			user: options.user,
			likes: options.likes,
			collection: options.collection,
		};
	}

	public vote(id: Types.ItemID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/items/vote`;
		const data = {
			id,
			vote: absoluteVote,
		};
		return this.requester.post(path, data);
	}
	public rateLimited(): Promise<Response.Pr0grammResponse> {
		const path = `/items/ratelimited`;
		return this.requester.post(path);
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

	// TODO: Split this into different types
	self?: boolean;
	tags?: Types.TagContent[];
	user?: Types.Username;
	likes?: Types.Likes;
	collection?: Types.Collection;
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
export interface WalkStreamNewerOptions extends GetItemsNewerOptions {
	end?: Types.ItemID;
}
export interface WalkStreamFunctions {
	getNextId(response: Response.GetItemsResponse): Types.ItemID;
	shouldContinue(response: Response.GetItemsResponse): boolean;
	getItems(options: GetItemsOptions, currentId: Types.ItemID): Promise<Response.GetItemsResponse>;
}

export class Pr0grammProfileService {
	constructor(private readonly requester: APIRequester) {
	}

	public getCommentsBefore(name: Types.Username, flags: Types.ItemFlags, before: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		const path = `/profile/comments`;
		return this.requester.get(path, {
			name,
			flags,
			before: ensureUnixTimetamp(before),
		});
	}
	public getCommentsAfter(name: Types.Username, flags: Types.ItemFlags, after: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		const path = `/profile/comments`;
		return this.requester.get(path, {
			name,
			flags,
			after: ensureUnixTimetamp(after),
		});
	}

	public follow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		const path = `/profile/follow`;
		return this.requester.post(path, { name });
	}
	public unfollow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		const path = `/profile/unfollow`;
		return this.requester.post(path, { name });
	}

	public getInfo(name: Types.Username, flags: Types.ItemFlags): Promise<Response.GetProfileInfoResponse> {
		const path = `/profile/info`;
		return this.requester.get(path, { name, flags });
	}
}

export class Pr0grammCommentsService {
	constructor(private readonly requester: APIRequester) {
	}

	public delete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/delete`;
		return this.requester.post(path, { id, reason });
	}
	public softDelete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/softDelete`;
		return this.requester.post(path, { id, reason });
	}
	public edit(id: Types.CommentID, newContent: string): Promise<Response.Pr0grammResponse> {
		const path = `/comments/edit`;
		return this.requester.post(path, { commentId: id, comment: newContent });
	}

	public vote(id: Types.CommentID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/comments/vote`;
		return this.requester.post(path, { id, vote: absoluteVote, });
	}

	public post(itemId: Types.ItemID, content: string, replyTo: Types.CommentID = 0): Promise<Response.Pr0grammResponse> {
		const path = `/comments/post`;
		return this.requester.post(path, {
			comment: content,
			itemId,
			parentId: replyTo,
		});
	}
}

export class Pr0grammTagsService {
	constructor(
		private readonly requester: APIRequester,
	) { }

	public add(itemId: Types.ItemID, tags: readonly Types.TagContent[]): Promise<Response.Pr0grammResponse> {
		const path = `/tags/add`;
		return this.requester.post(path, {
			itemId,
			tags: createTagList(tags),
			submit: "Tags speichern",
		});
	}

	/** TODO: This may not work */
	public delete(itemId: Types.ItemID, banUsers: boolean, days: Types.BanDuration, tags: readonly Types.TagContent[]): Promise<Response.Pr0grammResponse> {
		const path = `/tags/delete`;
		return this.requester.post(path, { itemId, tags, banUsers, days });
	}

	public getDetails(itemId: Types.ItemID): Promise<Response.GetDetailsResponse> {
		const path = `/tags/details`;
		return this.requester.get(path, { itemId });
	}

	public vote(id: Types.TagID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		const path = `/tags/vote`;
		return this.requester.post(path, { id, vote: absoluteVote });
	}
}

export class Pr0grammContactService {
	constructor(private readonly requester: APIRequester) {
	}

	public send(email: Types.Email, subject: string, message: string): Promise<Response.Pr0grammResponse> {
		const path = `/contact/send`;
		return this.requester.post(path, { email, subject, message });
	}
}

export class Pr0grammMessageService {
	constructor(private readonly requester: APIRequester) {
	}

	public getComments(): Promise<Response.InboxCommentsResponse> {
		const path = `/inbox/comments`;
		return this.requester.get(path);
	}

	public getCommentsOlder(older: Types.Timestamp): Promise<Response.InboxCommentsResponse> {
		const path = `/inbox/comments`;
		return this.requester.get(path, { older });
	}

	public getConversations(): Promise<Response.ConversationResponse> {
		const path = `/inbox/conversations`;
		return this.requester.get(path);
	}

	public getConversationsOlder(older: Types.ConversationID): Promise<Response.ConversationResponse> {
		const path = `/inbox/conversations`;
		return this.requester.get(path, { older });
	}

	public getMessages(user: Types.Username): Promise<Response.MessagesResponse> {
		const path = `/inbox/messages`;
		return this.requester.get(path, { with: user });
	}

	public sendMessage(recipientName: Types.Username, comment: Types.MessageComment): Promise<Response.MessagesResponse> {
		const path = `/inbox/post`;
		return this.requester.post(path, { recipientName, comment });
	}
}

export class Pr0grammUserService {
	constructor(private readonly requester: APIRequester) {
	}

	public ban(user: Types.Username, reason: string, days: Types.BanDuration): Promise<Response.Pr0grammResponse> {
		const path = `/user/ban`;
		return this.requester.post(path, { user, reason, days });
	}
	public changeEmail(token: Types.ChangeEmailToken): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/changeemail`;
		return this.requester.post(path, { token });
	}
	public changePassword(newPassword: Types.Password): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/changepassword`;
		return this.requester.post(path, { password: newPassword });
	}

	public getFollowList(flags: Types.ItemFlags): Promise<Response.GetFollowListReponse> {
		const path = `/user/followlist`;
		return this.requester.get(path, { flags });
	}

	public getInfo(): Promise<Response.GetUserInfoResponse> {
		const path = `/user/info`;
		return this.requester.get(path);
	}

	public invite(email: Types.Email): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/invite`;
		return this.requester.post(path, { email });
	}

	/**
	 * ????
	 */
	public joinWithInvite(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/joinwithinvite`;
		return this.requester.post(path, { token, email, password, name });
	}
	/**
	 * ????
	 */
	public joinWithToken(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.TokenResponse> {
		const path = `/user/joinwithtoken`;
		return this.requester.post(path, { token, email, password, name });
	}

	public loadInvite(token: Types.InviteToken): Promise<Response.LoadInviteResponse> {
		const path = `/user/loadinvite`;
		return this.requester.get(path, { token });
	}

	public loadPaymentToken(token: Types.PaymentToken): Promise<Response.TokenInfoResponse> {
		const path = `/user/loadpaymenttoken`;
		return this.requester.post(path, { token });
	}

	public requestCaptcha(): Promise<CaptchaResponse> {
		const path = `/user/captcha`;
		return this.requester.post(path, undefined, true);
	}

	public login(name: Types.Username, password: Types.Password): Promise<Response.LogInResponse>;
	public login(name: Types.Username, password: Types.Password, captchaToken: CaptchaResponse["token"], captchaSolution: string): Promise<Response.LogInResponse>;
	public login(name: Types.Username, password: Types.Password, captchaToken?: CaptchaResponse["token"], captchaSolution?: string): Promise<Response.LogInResponse> {
		const path = `/user/login`;
		return this.requester.post(path, {
			name,
			password,
			token: captchaToken,
			captcha: captchaSolution,
		}, true);
	}

	public logout(id: Types.SessionID): Promise<Response.Pr0grammResponse> {
		const path = `/user/logout`;
		return this.requester.post(path, { id });
	}

	/**
	 * ????
	 */
	public redeemToken(token: Types.InviteToken): Promise<Response.TokenResponse> {
		const path = `/user/redeemtoken`;
		return this.requester.post(path, { token });
	}

	public requestEmailChange(newEmail: Types.Email): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/requestemailchange`;
		return this.requester.post(path, { email: newEmail });
	}

	public resetPassword(name: Types.Username, password: Types.Password, token: Types.ChangePasswordToken): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/resetpassword`;
		return this.requester.post(path, { name, password, token });
	}

	public sendPasswordResetMail(email: Types.Email): Promise<Response.Pr0grammResponse> {
		const path = `/user/sendpasswordresetmail`;
		return this.requester.post(path, { email }, true);
	}

	public setSiteSettings(siteSettings: SiteSettingsOptions): Promise<Response.ChangeUserDataResponse> {
		const path = `/user/sitesettings`;
		const options = {
			likesArePublic: siteSettings.likesArePublic,
			showAds: siteSettings.showAds,
			userStatus: "um" + siteSettings.userStatus
		};
		return this.requester.post(path, options);
	}

	public sync(offset: Types.SyncID): Promise<Response.SyncResponse> {
		const path = `/user/sync`;
		return this.requester.get(path, { offset });
	}

	public validate(token: Types.Token): Promise<Response.SuccessableResponse> {
		const path = `/user/validate`;
		return this.requester.post(path, { token });
	}

	/**
	 * Requests an accessToken for the oAuth login.
	 * Inspired by the implementation of @RundesBalli:
	 * https://github.com/RundesBalli/pr0gramm-bondrucker/blob/b43038b713311c14564e941b798edfc67176dda2/public/inc/auth.php#L75-L80
	 *
	 * @param authCode The auth code that the pr0Auth API returned.
	 * @param userId Some cryptic user id, retrieved via the API.
	 * @param clientId ID of the application that is registered in the backend of pr0gramm.com (if you don't have this, request ask some admin).
	 * @param clientSecret Secret that is associated with the client id.
	 */
	public getAuthToken(authCode: string, userId: string, clientId: string, clientSecret: string): Promise<Response.AccessTokenResponse> {
		const path = `/user/authtoken`;
		return this.requester.post(path, {
			authCode,
			userId,
			clientId,
			clientSecret,
		}, true);
	}
	public getIdentifier(): Promise<Response.GetUserNameResponse> {
		return this.requester.get(`/user/identifier`);
	}
	public getUserName(): Promise<Response.GetUserNameResponse> {
		return this.requester.get(`/user/name`);
	}
	public getUserScore(): Promise<Response.GetUserScoreResponse> {
		return this.requester.get(`/user/score`);
	}
}

export interface CaptchaResponse {
	token: string;
	/** Most likely contains a data URI */
	captcha: string;
}

export interface SiteSettingsOptions {
	likesArePublic: boolean;
	showAds: boolean;
	userStatus: Types.UserMark;
}
