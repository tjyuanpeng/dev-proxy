import http from 'http'
import httpProxy from 'http-proxy'
import { parseArgs } from "node:util"

function createUrl(url, base) {
  try {
    return new URL(url, base).toString()
  } catch (_e) {
    return '(create url error)'
  }
}

function start({ tport, url, port = 80, log = false }) {
  if (tport) {
    url = `http://0.0.0.0:${tport}/`
  }

  const proxy = httpProxy.createProxyServer({
    followRedirects: true,
  })

  // handle proxy error
  proxy.on('error', function (e) {
    console.error(`[proxy] ${e}`)
  })

  proxy.on('proxyRes', function (proxyRes, req, res) {
    try {
      const p = proxyRes.req.socket.remotePort
      const port = p === 80 || p === 443 ? '' : `:${p}`
      res.setHeader(
        'X-PROXY-TARGET',
        `${proxyRes.req.protocol}//${proxyRes.req.host}${port}${proxyRes.req.path}`
      )
    } catch (e) {
      console.error(`[proxy] [proxyRes] ${e}`)
    }
  })

  proxy.on('proxyReq', function (proxyReq, req, res, options) {
    proxyReq.setHeader('Host', req.headers.host)
  })

  // create http server
  const server = http.createServer(function (req, res) {
    log && console.info(`[web] from:[${req.url}], to:[${createUrl(req.url, url)}]`)
    proxy.web(req, res, {
      target: url,
      changeOrigin: true,
    })
  })

  // handle websocket request
  server.on('upgrade', function (req, socket, head) {
    log && console.info(`[ws] from:[${req.url}], to:[${url}]`)
    proxy.ws(req, socket, head, {
      target: url,
      changeOrigin: true,
    })
  })

  // handle http error
  server.on('error', function (e) {
    console.error(`[server] error: ${e}`)
  })

  server.listen(port, e => {
    if (e) {
      console.error(`[server] listening error: ${e}`)
    } else {
      console.info(`[server] start listening on port: [${port}], target url: [${url}]`)
    }
  })
}

const args = parseArgs({
  options: {
    url: {
      type: "string",
      short: "u",
    },
    tport: {
      type: "string",
      short: "t",
    },
    port: {
      type: "string",
      short: "p",
    },
    log: {
      type: "boolean",
      short: "l",
    },
  },
})
start(args.values)
