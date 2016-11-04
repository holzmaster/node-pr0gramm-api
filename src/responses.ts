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
