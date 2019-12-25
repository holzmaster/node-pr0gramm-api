import * as Types from "./common-types";
import { getUserAgent } from "./client-constants";

export function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	return typeof v === "number"
		? v | 0
		: (v.getTime() / 1000) | 0;
}

export function createTagList(tags: readonly Types.TagContent[]): Types.TagList {
	return tags.join(" ");
}

export function createDefaultHeaders() {
	return {
		"User-Agent": getUserAgent()
	};
}

export type QueryParams = Record<string, string | undefined>;

export function addQueryParams(url: string, params: QueryParams | undefined) {
	return params
		? url + "?" + encodeQueryParams(params)
		: url;
}

export function encodeQueryParams(params: QueryParams | undefined): string {
	return params === undefined
		? ""
		: new URLSearchParams(removeUndefinedValues(params)).toString();
}

/**
 * Taken from: https://stackoverflow.com/a/38340730
 */
function removeUndefinedValues(qp: Record<string, string | undefined>): Record<string, string> {
	const copy = { ...qp };
	Object.keys(copy).forEach((key) => (copy[key] === undefined) && delete copy[key]);
	return copy as Record<string, string>
}
