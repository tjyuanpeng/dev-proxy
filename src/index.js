import cac from 'cac'
import http from 'http'
import httpProxy from 'http-proxy'

function createUrl(url, base) {
  try {
    return new URL(url, base).toString()
  } catch (_e) {
    return '(create url error)'
  }
}

function start({ url, port = 80, log = false }) {
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
  return function close () {
    proxy.close()
    server.close()
    console.info(`[server] service closed`)
  }
}

let closehandler = null
const cli = cac()
cli
  .command('[target-url]', 'start proxy servie with target url')
  .option('-u, --url <url>', 'target url', {
    default: 'http://0.0.0.0/',
  })
  .option('-t, --tport <tport>', 'target port')
  .option('-p, --port', 'http server port', {
    default: 80,
  })
  .option('-l, --log', 'show verbose log', {
    default: false,
  })
  .action((targetUrl, options) => {
    const url = new URL(targetUrl || options.url)
    url.port = options.tport
    closehandler && closehandler()
    closehandler = start({
      url,
      port: options.port,
      log: options.log,
    })
  })
cli.help()
cli.parse()
