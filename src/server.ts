import { FastMCP } from 'fastmcp'
import { version } from '../package.json'

export const server: FastMCP = new FastMCP({
  name: 'post-bridge MCP',
  // @ts-expect-error
  version: version,
})
