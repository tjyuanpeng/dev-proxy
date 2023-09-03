import http from 'http'
import httpProxy from 'http-proxy'

const TARGET_URL = 'http://0.0.0.0:8081/'
// const TARGET_URL = 'http://0.0.0.0:5172/'

const PORT = 80

function createUrl(url, base) {
  try {
    return new URL(url, base).toString()
  } catch (_e) {
    return '(create url error)'
  }
}

function start() {
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
    console.info(`[web] from:[${req.url}], to:[${createUrl(req.url, TARGET_URL)}]`)
    proxy.web(req, res, {
      target: TARGET_URL,
      changeOrigin: true,
    })
  })

  // handle websocket request
  server.on('upgrade', function (req, socket, head) {
    console.info(`[ws] from:[${req.url}], to:[${TARGET_URL}]`)
    proxy.ws(req, socket, head, {
      target: TARGET_URL,
      changeOrigin: true,
    })
  })

  // handle http error
  server.on('error', function (e) {
    console.error(`[server] error: ${e}`)
  })

  server.listen(PORT, e => {
    if (e) {
      console.error(`[server] listening error: ${e}`)
    } else {
      console.info(`[server] start listening on port: [${PORT}], TARGET_URL: [${TARGET_URL}]`)
    }
  })
}

start()
