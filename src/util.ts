import * as Types from "./common-types";
import { getUserAgent } from "./client-constants";

export function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	return typeof v === "number"
		? v | 0
		: (v.getTime() / 1000) | 0;
}

export function createTagList(tags: Types.Tag[]): Types.TagList {
	return tags.join(",");
}

export function createDefaultHeaders() {
	return {
		"User-Agent": getUserAgent()
	};
}
