export type ItemID = number;
export type UserID = number;
export type CommentID = number;
export type TagID = number;
export type PromotedID = number;

export type Score = number;

export type TagList = string;

export type Username = string;
export type Email = string;
export type Confidence = number;
export type UnixTimestamp = number;
export type Timestamp = UnixTimestamp | Date;
export type BanDuration = number; // In days

export type Likes = string; // TODO: What is this?
export type Pr0grammError = Object;

export type Cache = string;
export type Roundtrip = number;

export type Pr0grammURL = string;
export type ThumbnailURL = Pr0grammURL;
export type ImageURL = Pr0grammURL;
export type FullSizeURL = Pr0grammURL;
export type BadgeImageURL = Pr0grammURL;
export type BadgeLinkURL = Pr0grammURL;

export enum UserMark {
	Schwuchtel = 0,
	Neuschwuchtel = 1,
	Altschwuchtel = 2,
	Administrator = 3,
	Gebannt = 4,
	Moderator = 5,
	Fliesentisch = 6,
	LebendeLegende = 7,
	Wichtel = 8,
	EdlerSpender = 9,
}

export enum Vote {
	Down = -1,
	None = 0,
	Up = 1,
}

export enum ItemFlags {
	SFW = 1,
	NSFW = 2,
	NSFL = 4,
	All = SFW | NSFW | NSFL,
}

/*
export enum PromotionStatus {
	None = 0,
	Promoted = 1
}
*/

export interface Comment {
	id: CommentID;
	up: number;
	down: number;
	created: Timestamp;
	content: string;
}

export interface Tag {
	id: TagID;
	tag: string;
	confidence: Confidence;
}

export interface ItemComment extends Comment {
	parent: CommentID | null;
	confidence: Confidence;
	name: Username;
	mark: UserMark;
}

export interface ItemTagDetails {
	user: Username;
	up: number;
	down: number;
	votes: ItemTagVote[];
}

export interface ItemTagVote {
	user: Username;
	vote: Vote;
}

export interface ProfileComment extends Comment {
	itemId: ItemID;
	thumb: ThumbnailURL;
}

export interface CommentUser {
	id: UserID;
	name: Username;
	mark: UserMark;
}

export interface User extends CommentUser {
	registered: Timestamp;
	score: Score;
	admin: boolean;
	banned: boolean;
	bannedUntil: Timestamp | null;
}

export interface FollowedUser {
	itemId: ItemID;
	thumb: ThumbnailURL;
	name: Username;
	mark: UserMark;
	lastPost: Timestamp;
	followCreated: Timestamp;
}

export interface InvitingUser {
	name: Username;
	mark: UserMark;
	email: Email;
}

export interface ProfileUpload {
	id: ItemID;
	thumb: ThumbnailURL;
}

export interface ProfileBadge {
	image: BadgeImageURL;
	description: string;
	link: BadgeLinkURL;
	created: Timestamp;
}

export interface DynamicProfileBadge extends ProfileBadge {
	name: string; // ??
	extra: string;
}

export interface Item {
	id: ItemID;
	promotedId: PromotedID;
	up: number;
	down: number;
	created: Timestamp;
	image: ImageURL;
	thumb: ThumbnailURL;
	fullsize: FullSizeURL;
	source: string;
	flags: ItemFlags;
	user: Username;
	mark: UserMark;
}

export interface LikedItem {
	id: ItemID;
	thumb: ThumbnailURL;
}

export type DeleteItemReason = "Regel #1 - Bild unzureichend getagged (nsfw/nsfl)"
	| "Regel #2 - Gore/Porn/Suggestive Bilder mit Minderjährigen"
	| "Regel #3 - Tierporn"
	| "Regel #4 - Stumpfer Rassismus/Nazi-Nostalgie"
	| "Regel #5 - Werbung/Spam"
	| "Regel #6 - Infos zu Privatpersonen"
	| "Regel #7 - Bildqualität"
	| "Regel #8 - Ähnliche Bilder in Reihe"
	| "Regel #12 - Warez/Logins zu Pay Sites"
	| "Regel #14 - Screamer/Sound-getrolle"
	| "Regel #15 - reiner Musikupload"
	| "Repost"
	| "Auf Anfrage";


export interface KeyValue<T> {
	[index: string]: T;
}
