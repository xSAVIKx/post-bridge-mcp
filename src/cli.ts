import { server } from './server.ts'

export async function main(): Promise<void> {
  await server.start({ transportType: 'stdio' })
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
