import * as Types from "./common-types";

export interface Pr0grammResponse {
	ts: Types.Timestamp;
	cache: Types.Cache;
	rt: Types.Roundtrip;
	qc: number; // ??
}

export interface GetItemsInfoResponse extends Pr0grammResponse {
	tags: Types.Tag[];
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
