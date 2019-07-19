const VERSION = require("../package.json").version;

export const PR0GRAMM_BASE_URL = "https://pr0gramm.com";
export const PR0GRAMM_API_PATH = "/api";

export function getUserAgent() {
	return `pr0gramm-api/${VERSION} (Node.js)`;
}
