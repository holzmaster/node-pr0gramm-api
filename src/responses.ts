import * as Types from "./common-types";

export interface Pr0grammResponse {
	ts: Types.Timestamp;
	cache: Types.Cache;
	/** Response Time */
	rt: number;
	/** Query count */
	qc: number;
}

export interface GetItemsInfoResponse extends Pr0grammResponse {
	tags: Types.ItemTag[];
	comments: Types.ItemComment[];
}

export interface GetItemsResponse extends Pr0grammResponse {
	atEnd: boolean;
	atStart: boolean;
	error: Types.Pr0grammError;
	items: Types.Item[];
}

export interface GetCommentsResponse extends Pr0grammResponse {
	commants: Types.ProfileComment[];
	hasOlder: boolean;
	hasNewer: boolean;
	user: Types.CommentUser;
}

export interface GetProfileInfoResponse extends Pr0grammResponse {
	user: Types.User;
	comments: Types.ProfileComment[];
	commentCount: number;
	commentLikesCount: number;
	comments_likes: Types.LikedProfileComment[];
	uploads: Types.ProfileUpload[];
	uploadCount: number;
	likesArePublic: boolean;
	likes: Types.LikedItem[];
	likeCount: number;
	tagCount: number;
	badges: Types.ProfileBadge[];
	followcount: number;
	following: boolean;
}

export interface GetDetailsResponse extends Pr0grammResponse {
	tags: Types.ItemTagDetails[];
}

export interface ChangeUserDataResponse extends Pr0grammResponse {
	account: string; // ??
	error: string | null | undefined; // ??
}

export interface GetFollowListReponse extends Pr0grammResponse {
	list: Types.FollowedUser[];
}

export interface GetUserInfoResponse extends Pr0grammResponse {
	account: Types.AccountInfo;
	invited: Types.InvitingUser[];
}

export interface TokenResponse extends Pr0grammResponse {
	tokenError: string | null; // ??
	error: string | null | undefined; // ??
}

export interface LoadInviteResponse extends Pr0grammResponse {
	inviter: Types.InvitingUser;
	email: Types.Email;
}

export interface TokenInfoResponse extends Pr0grammResponse {
	token: Types.Token | null;
}

export interface SuccessableResponse extends Pr0grammResponse {
	success: boolean;
	identifier?: string;
}

export interface WrongCredentialsLogInResponse extends SuccessableResponse {
	success: false;
	ban: null;
}
export interface BannedLogInResponse extends SuccessableResponse {
	success: false;
	ban: Types.BanInfo;
}
export interface SuccessfulLogInResponse extends SuccessableResponse {
	success: true;
	identifier: string;
	ban: null;
}
export type LogInResponse = SuccessfulLogInResponse | WrongCredentialsLogInResponse | BannedLogInResponse;

export interface SyncResponse extends Pr0grammResponse {
	inboxCount: number;
	log: Types.LogItem[] | string; // TODO
	logLength: number;
	score: Types.Score;
}

export interface ConversationResponse extends Pr0grammResponse {
	conversations: Types.Conversation[];
	atEnd: boolean;
}

export interface InboxCommentsResponse extends Pr0grammResponse {
	messages: Types.InboxComments[];
}

export interface MessagesResponse extends Pr0grammResponse {
	messages: Types.Message[];
	atEnd: boolean;
}

export interface AccessTokenResponse extends Pr0grammResponse {
	accessToken: string;
}
export interface GetUserNameResponse extends Pr0grammResponse {
	name: string;
}

export interface GetUserScoreResponse extends Pr0grammResponse {
	score: number;
}
