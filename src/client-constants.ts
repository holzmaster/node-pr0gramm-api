const VERSION = "3.0.0-rc2";
const PROTOCOL_PREFIX = "https://";
const PROTOCOL_PREFIX_INSECURE = "http://";
const HOST_NAME = "pr0gramm.com";

export function getBaseAddress(insecure?: boolean): string {
	return (insecure ? PROTOCOL_PREFIX_INSECURE : PROTOCOL_PREFIX) + HOST_NAME;
}
export function getAPIBaseAddress(insecure: boolean): string {
	return getBaseAddress(insecure) + "/api";
}

export function getUserAgent() {
	return `pr0gramm-api/${VERSION} (Node.js)`;
}
