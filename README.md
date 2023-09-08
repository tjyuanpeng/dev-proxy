# develop proxy

http & websocket request proxy for development

## install

```
pnpm i
```

## run

```
pnpm start -t 5172
```

## CLI options

use `node:util.parseArgs` to resolve cli-arguments

refer: [https://nodejs.dev/en/api/v18/util/#utilparseargsconfig](https://nodejs.dev/en/api/v18/util/#utilparseargsconfig)

```
options: {
  url: {// target url
    type: "string",
    short: "u",
  },
  tport: {// the port of localhost, if set, `url` option will be overridden by `http://localhost:${tport}/`
    type: "string",
    short: "t",
  },
  port: {// the port of proxy service, default is 80
    type: "string",
    short: "p",
  },
  log: {//show verbose log, default is false
    type: "boolean",
    short: "l",
  },
},
```
