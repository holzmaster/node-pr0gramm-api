# pr0gramm-api
A Node.js API for pr0gramm written in TypeScript.
```Shell
npm install -S pr0gramm-api
```

## Usage
```TypeScript
import { Pr0grammAPI, ItemFlags } from "pr0gramm-api";

const api = new Pr0grammAPI();

async function main() {
    let mainItems = await api.items.getItems({
        promoted: true,
        flags: ItemFlags.All
    });
    console.dir(mainItems.items);

    let loginResponse = await api.user.login("cha0s", "stahl0fen80");
    if(!loginResponse.success) {
        console.log("Could not log in :(");
        if(loginResponse.ban !== null) {
            console.log("You are banned. Reason:");
            console.log(loginResponse.ban.reason);
            return;
        }
    }
}
main();
```
