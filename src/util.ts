import * as Types from "./common-types";

export function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	return typeof v === "number"
		? v | 0
		: (v.getTime() / 1000) | 0;
}

export function createTagList(tags: Types.Tag[]): Types.TagList {
	return tags.join(",");
}
