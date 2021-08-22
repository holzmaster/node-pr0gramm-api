import * as Types from "./common-types";
import { getUserAgent } from "./client-constants";

export function ensureUnixTimetamp(v: Types.Timestamp): Types.UnixTimestamp {
	"use asm"; // Maximum micro optimization
	return typeof v === "number"
		? v | 0
		: (v.getTime() / 1000) | 0;
}

export function createTagList(tags: readonly Types.TagContent[]): Types.TagList {
	return tags.map(str => str.split(" ").join("+")).join(",")
}

export function createDefaultHeaders(): Record<string, string> {
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

export function addApiKeyToHeader(headers: Readonly<Record<string, string>>, oAuthKey: string | undefined): Record<string, string> {
	if (!oAuthKey)
		return headers;

	// We set a non-standard HTTP header (not even prefixed with X-)
	// This seems to be the way to go as RB also does it like that:
	// https://github.com/RundesBalli/pr0gramm-apiCall/blob/e49470faed1bd363c2db4b25f776f6c12d0643a6/apiCall.php#L68-L79
	return {
		...headers,
		"pr0-api-key": oAuthKey,
	};
}
