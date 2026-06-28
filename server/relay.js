const http = require('http')
const Gun = require('gun/lib/server')

const PORT = process.env.PORT || 8765

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', peers: Gun.peers }))
    return
  }
  res.writeHead(404)
  res.end()
})

Gun({ web: server, file: 'data.json' })

server.listen(PORT, () => {
  console.log(`Gun relay running on http://0.0.0.0:${PORT}/gun`)
  console.log(`Health check: http://0.0.0.0:${PORT}/health`)
})
