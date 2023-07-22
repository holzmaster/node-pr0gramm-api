import * as Response from "./responses";
import * as Types from "./common-types";
import { APIRequester } from "./requester";
import { ensureUnixTimestamp, createTagList } from "./util";

/**
 * A set of APIs to interact with pr0gramm. Its design is based on the API the site uses.
 *
 * If you don't need the whole API, you can instantiate the services yourself (e. g. Pr0grammItemsService).
 */
export class Pr0grammAPI {
	readonly items: Pr0grammItemsService;
	readonly tags: Pr0grammTagsService;
	readonly messages: Pr0grammMessageService;
	readonly comments: Pr0grammCommentsService;
	readonly profile: Pr0grammProfileService;
	readonly contact: Pr0grammContactService;
	readonly user: Pr0grammUserService;

	private constructor(
		readonly requester: APIRequester,
	) {
		this.items = new Pr0grammItemsService(requester);
		this.tags = new Pr0grammTagsService(requester);
		this.messages = new Pr0grammMessageService(requester);
		this.comments = new Pr0grammCommentsService(requester);
		this.profile = new Pr0grammProfileService(requester);
		this.contact = new Pr0grammContactService(requester);
		this.user = new Pr0grammUserService(requester);
	}

	static create(requester: APIRequester): Pr0grammAPI {
		return new Pr0grammAPI(requester);
	}
}


export class Pr0grammItemsService {
	constructor(private readonly requester: APIRequester) { }

	delete(options: DeleteItemOptions): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/items/delete", options);
	}

	getInfo(itemId: Types.ItemID): Promise<Response.GetItemsInfoResponse> {
		return this.requester.get("/items/info", { itemId });
	}

	getItems(options: GetItemsOptions): Promise<Response.GetItemsResponse> {
		return this.requester.get("/items/get", Pr0grammItemsService.parseRawGetItemsOptions(options));
	}
	getItemsNewer(options: GetItemsNewerOptions): Promise<Response.GetItemsResponse> {
		return this.requester.get("/items/get", {
			newer: options.newer,
			...Pr0grammItemsService.parseRawGetItemsOptions(options),
		});
	}
	getItemsOlder(options: GetItemsOlderOptions): Promise<Response.GetItemsResponse> {
		return this.requester.get("/items/get", {
			older: options.older,
			...Pr0grammItemsService.parseRawGetItemsOptions(options),
		});
	}
	getItemsAround(options: GetItemsAroundOptions): Promise<Response.GetItemsResponse> {
		return this.requester.get("/items/get", {
			id: options.around,
			...Pr0grammItemsService.parseRawGetItemsOptions(options),
		});
	}

	walkStreamNewer(options: GetItemsNewerOptions): AsyncIterableIterator<Types.Item> {
		return this.walkStream(
			options.newer,
			options, {
			getNextId: res => res.items[res.items.length - 1].id,
			shouldContinue: res => !res.atStart,
			getItems: (opts, currentId) => this.getItemsNewer({ ...opts, newer: currentId }),
		}
		);
	}
	walkStreamOlder(options: GetItemsOlderOptions): AsyncIterableIterator<Types.Item> {
		return this.walkStream(
			options.older,
			options, {
			getNextId: res => res.items[res.items.length - 1].id,
			shouldContinue: res => !res.atEnd,
			getItems: (opts, currentId) => this.getItemsOlder({ ...opts, older: currentId }),
		}
		);
	}

	async *walkStream(start: Types.ItemID, options: GetItemsOptions, functions: WalkStreamFunctions): AsyncIterableIterator<Types.Item> {
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

	vote(id: Types.ItemID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/items/vote", {
			id,
			vote: absoluteVote,
		});
	}
	rateLimited(): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/items/ratelimited");
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
	constructor(private readonly requester: APIRequester) { }

	getCommentsBefore(name: Types.Username, flags: Types.ItemFlags, before: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		return this.requester.get("/profile/comments", {
			name,
			flags,
			before: ensureUnixTimestamp(before),
		});
	}
	getCommentsAfter(name: Types.Username, flags: Types.ItemFlags, after: Types.Timestamp): Promise<Response.GetCommentsResponse> {
		return this.requester.get("/profile/comments", {
			name,
			flags,
			after: ensureUnixTimestamp(after),
		});
	}

	follow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/profile/follow", { name });
	}
	unfollow(name: Types.Username): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/profile/unfollow", { name });
	}

	getInfo(name: Types.Username, flags: Types.ItemFlags): Promise<Response.GetProfileInfoResponse> {
		return this.requester.get("/profile/info", { name, flags });
	}
}

export class Pr0grammCommentsService {
	constructor(private readonly requester: APIRequester) { }

	delete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/comments/delete", { id, reason });
	}
	softDelete(id: Types.CommentID, reason: string): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/comments/softDelete", { id, reason });
	}
	edit(id: Types.CommentID, newContent: string): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/comments/edit", { commentId: id, comment: newContent });
	}

	vote(id: Types.CommentID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/comments/vote", { id, vote: absoluteVote, });
	}

	post(itemId: Types.ItemID, content: string, replyTo: Types.CommentID = 0): Promise<Response.PostCommentResponse> {
		return this.requester.post("/comments/post", {
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

	add(itemId: Types.ItemID, tags: readonly Types.TagContent[]): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/tags/add", {
			itemId,
			tags: createTagList(tags),
			submit: "Tags speichern",
		});
	}

	/** TODO: This may not work */
	delete(itemId: Types.ItemID, banUsers: boolean, days: Types.BanDuration, tags: readonly Types.TagContent[]): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/tags/delete", { itemId, tags, banUsers, days });
	}

	getDetails(itemId: Types.ItemID): Promise<Response.GetDetailsResponse> {
		return this.requester.get("/tags/details", { itemId });
	}

	vote(id: Types.TagID, absoluteVote: Types.Vote): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/tags/vote", { id, vote: absoluteVote });
	}
}

export class Pr0grammContactService {
	constructor(private readonly requester: APIRequester) { }

	send(email: Types.Email, subject: string, message: string): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/contact/send", { email, subject, message });
	}
}

export class Pr0grammMessageService {
	constructor(private readonly requester: APIRequester) {
	}

	deleteConversation(recipientName: Types.Username): Promise<Response.Pr0grammResponse> {
        return this.requester.post("/inbox/deleteConversation", { recipientName });
    }

	getComments(): Promise<Response.InboxCommentsResponse> {
		return this.requester.get("/inbox/comments");
	}

	getCommentsOlder(older: Types.Timestamp): Promise<Response.InboxCommentsResponse> {
		return this.requester.get("/inbox/comments", { older });
	}

	getConversations(): Promise<Response.ConversationResponse> {
		return this.requester.get("/inbox/conversations");
	}

	getConversationsOlder(older: Types.ConversationID): Promise<Response.ConversationResponse> {
		return this.requester.get("/inbox/conversations", { older });
	}

	getMessages(user: Types.Username): Promise<Response.MessagesResponse> {
		return this.requester.get("/inbox/messages", { with: user });
	}

	sendMessage(recipientName: Types.Username, comment: Types.MessageComment): Promise<Response.MessagesResponse> {
		return this.requester.post("/inbox/post", { recipientName, comment });
	}
}

export class Pr0grammUserService {
	constructor(private readonly requester: APIRequester) {
	}

	ban(user: Types.Username, reason: string, days: Types.BanDuration): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/user/ban", { user, reason, days });
	}
	changeEmail(token: Types.ChangeEmailToken): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/changeemail", { token });
	}
	changePassword(newPassword: Types.Password): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/changepassword", { password: newPassword });
	}

	getFollowList(flags: Types.ItemFlags): Promise<Response.GetFollowListReponse> {
		return this.requester.get("/user/followlist", { flags });
	}

	getInfo(): Promise<Response.GetUserInfoResponse> {
		return this.requester.get("/user/info");
	}

	invite(email: Types.Email): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/invite", { email });
	}

	/**
	 * ????
	 */
	joinWithInvite(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/joinwithinvite", { token, email, password, name });
	}
	/**
	 * ????
	 */
	joinWithToken(token: Types.InviteToken, email: Types.Email, password: Types.Password, name: Types.Username): Promise<Response.TokenResponse> {
		return this.requester.post("/user/joinwithtoken", { token, email, password, name });
	}

	loadInvite(token: Types.InviteToken): Promise<Response.LoadInviteResponse> {
		return this.requester.get("/user/loadinvite", { token });
	}

	loadPaymentToken(token: Types.PaymentToken): Promise<Response.TokenInfoResponse> {
		return this.requester.post("/user/loadpaymenttoken", { token });
	}

	requestCaptcha(): Promise<CaptchaResponse> {
		return this.requester.post("/user/captcha", undefined, true);
	}

	login(name: Types.Username, password: Types.Password): Promise<Response.LogInResponse>;
	login(name: Types.Username, password: Types.Password, captchaToken: CaptchaResponse["token"], captchaSolution: string): Promise<Response.LogInResponse>;
	login(name: Types.Username, password: Types.Password, captchaToken?: CaptchaResponse["token"], captchaSolution?: string): Promise<Response.LogInResponse> {
		return this.requester.post("/user/login", {
			name,
			password,
			token: captchaToken,
			captcha: captchaSolution,
		}, true);
	}

	logout(id: Types.SessionID): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/user/logout", { id });
	}

	/**
	 * ????
	 */
	redeemToken(token: Types.InviteToken): Promise<Response.TokenResponse> {
		return this.requester.post("/user/redeemtoken", { token });
	}

	requestEmailChange(newEmail: Types.Email): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/requestemailchange", { email: newEmail });
	}

	resetPassword(name: Types.Username, password: Types.Password, token: Types.ChangePasswordToken): Promise<Response.ChangeUserDataResponse> {
		return this.requester.post("/user/resetpassword", { name, password, token });
	}

	sendPasswordResetMail(email: Types.Email): Promise<Response.Pr0grammResponse> {
		return this.requester.post("/user/sendpasswordresetmail", { email }, true);
	}

	setSiteSettings(siteSettings: SiteSettingsOptions): Promise<Response.ChangeUserDataResponse> {
		const options = {
			likesArePublic: siteSettings.likesArePublic,
			showAds: siteSettings.showAds,
			userStatus: "um" + siteSettings.userStatus
		};
		return this.requester.post("/user/sitesettings", options);
	}

	sync(offset: Types.SyncID): Promise<Response.SyncResponse> {
		return this.requester.get("/user/sync", { offset });
	}

	validate(token: Types.Token): Promise<Response.SuccessableResponse> {
		return this.requester.post("/user/validate", { token });
	}

	getIdentifier(): Promise<Response.GetIdentifierResponse> {
		return this.requester.get("/user/identifier");
	}
	getUserName(): Promise<Response.GetUserNameResponse> {
		return this.requester.get("/user/name");
	}
	getUserScore(): Promise<Response.GetUserScoreResponse> {
		return this.requester.get("/user/score");
	}
	getMe(): Promise<Response.GetMeResponse> {
		return this.requester.get("/user/me");
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
