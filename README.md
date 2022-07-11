# pr0gramm-api [![Build Status](https://travis-ci.com/holzmaster/node-pr0gramm-api.svg?branch=master)](https://travis-ci.com/holzmaster/node-pr0gramm-api)
A Node.js API for pr0gramm written in TypeScript.
```Shell
npm install -S pr0gramm-api
```

## Usage
Login with username/password:
```ts
import { Pr0grammAPI, NodeRequester, ItemFlags } from "pr0gramm-api";

main();
async function main() {
    const requester = NodeRequester.create();
    // When using this library in the browser, use this requester:
    // const requester = BrowserRequester.create();

    const api = Pr0grammAPI.create(requester);

    const mainItems = await api.items.getItems({
        promoted: true,
        flags: ItemFlags.SFW
    });

    console.log(mainItems.items);

    const captchaData = await api.user.requestCaptcha();
    // captchaData.captcha contains the image as a data URI

    const loginResponse = await api.user.login("cha0s", "stahl0fen80", captchaData.token, "aaaaa");
    if(!loginResponse.success) {
        console.log("Could not log in :(");
        if(loginResponse.ban !== null) {
            console.log("You are banned. Reason:");
            console.log(loginResponse.ban.reason);
            return;
        }
    }
}
```

Login with oAuth:
```ts
import * as readline from "node:readline/promises";
import { AuthorizationCode } from "simple-oauth2";
import { Pr0grammAPI, NodeRequester, ItemFlags } from "pr0gramm-api";

const oAuthAccessCodeClient = new AuthorizationCode({
    client: {
        // See above
        id: "<client_id>",
        secret: "<client_secret>",
    },
    auth: {
        tokenHost: "https://pr0gramm.com/",
        tokenPath: "/api/oauth/createAccessToken",
        authorizePath: "/oauth/authorize",
    }
});

main();
async function main() {
    const authorizationUri = oAuthAccessCodeClient.authorizeURL({
        redirect_uri: authCallbackUrl,
        scope: "items.get",
        state: "<state>",
    });

    console.log("Go to this URL and enter the auth code from ?code=<auth code> from the callback URL:");
    console.log(authorizationUri);

    const rl = readline.createInterface({ process.stdin, process.stdin });
    const authCode = await rl.question("Auth-Code: ");
    rl.close();

    const tokenHandler = await oAuthAccessCodeClient.getToken({
        code: authCode,
    });

    const requester = NodeRequester.create();
    requester.setOAuthAccessToken(tokenHandler.token.access_token);

    const api = Pr0grammAPI.create(requester);

    const mainItems = await api.items.getItems({
        promoted: true,
        flags: ItemFlags.All
    });

    console.log(mainItems.items);
}
```


### Stream Walker
The item stream requires you to call the next page of elements. Because it is a common operation to just walk over all items in the stream, there is a stream walker api for convenience:
```TypeScript
import { Pr0grammAPI, NodeRequester, ItemFlags } from "pr0gramm-api";

main();
async function main() {
    const api = Pr0grammAPI.create(NodeRequester.create());

    // Create a walker that iterates through the entire stream of elements
    // starting at item 0, going upwards
    const itemStream = api.items.walkStreamNewer({
        newer: 0,
        flags: ItemFlags.SFW,
        promoted: false,
    });

    // Asynchronous iteration over all items on pr0gramm
    // automatically requests next items
    for await (const item of itemStream) {
        console.log(item.id + ": " + item.user);
    }
}
```
*Important*:
- This approach uses async generators, which are currently hidden behind node's `--harmony` flag. To use this API, you need to start node with `--harmony`.
- If you are using TypeScript, you need to have `"esnext.asynciterable"` and `"es6"` in your `lib` entry in `tsconfig.json`.
- The module is exposed as CommonJS, not (yet) ES modules. If you use plain JavaScript, keep in mind using CommonJS imports instead of ES imports: `const { Pr0grammAPI, ItemFlags } = require("pr0gramm-api");`
