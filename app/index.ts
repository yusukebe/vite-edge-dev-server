import { Hono } from 'hono'
import { getRuntimeKey } from 'hono/adapter'

const app = new Hono()

app.get('/', (c) => {
  return c.html(`<html><body><h1>Hello! from ${getRuntimeKey()}</h1></body></html>`)
})

export default app
