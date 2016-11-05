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
    const response = await api.items.getItems({
        promoted: true,
        flags: ItemFlags.All
    });
    console.dir(response.items);
}
main();
```
