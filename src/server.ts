import { FastMCP } from 'fastmcp'
import {
  type Configuration,
  type ConfigurationParameters,
  createConfiguration,
  ServerConfiguration,
  SocialAccountsApi,
} from 'post-bridge-api'
import { z } from 'zod'
import { version } from '../package.json'

function getApiConfig(): Configuration {
  const baseUrl =
    process.env.POST_BRIDGE_API_BASE_URL ?? 'https://api.post-bridge.com'
  const token = process.env.POST_BRIDGE_API_TOKEN

  if (!token) {
    throw new Error(
      'API token is required. Please set the POST_BRIDGE_API_TOKEN environment variable.',
    )
  }

  const baseServer = new ServerConfiguration(baseUrl, {})
  const confParams: ConfigurationParameters = {
    baseServer,
    authMethods: {
      bearer: {
        tokenProvider: {
          getToken: () => token,
        },
      },
    },
  }

  return createConfiguration(confParams)
}

const socialAccountsApi = new SocialAccountsApi(getApiConfig())

export const server: FastMCP = new FastMCP({
  name: 'post-bridge MCP',
  // @ts-expect-error
  version: version,
})

server.addTool({
  name: 'socialAccounts_list',
  description:
    'List social accounts from Post Bridge with optional filters: platform(s), username(s), and pagination.',
  parameters: z.object({
    offset: z
      .number()
      .int()
      .nonnegative()
      .default(0)
      .describe('Number of items to skip'),
    limit: z
      .number()
      .int()
      .positive()
      .max(200)
      .default(50)
      .describe('Number of items to return (max 200).'),
    platform: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe(
        'Filter by platform(s). Examples: ["twitter"], ["twitter","instagram"].',
      ),
    username: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe('Filter by username(s). Examples: ["alice"], ["alice","bob"].'),
  }),
  execute: async (args) => {
    const { offset, limit, platform, username } = args as {
      offset: number
      limit: number
      platform?: string[]
      username?: string[]
    }

    const res =
      await socialAccountsApi.socialAccountsControllerGetAllSocialAccountsV1(
        offset,
        limit,
        platform,
        username,
      )
    return JSON.stringify(res)
  },
})
server.addTool({
  name: 'socialAccounts_get',
  description:
    'Get a single social account by its numeric ID from Post Bridge.',
  parameters: z.object({
    id: z.number().int().positive().describe('Social Account ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: number }
    const res =
      await socialAccountsApi.socialAccountsControllerGetSocialAccountV1(id)
    return JSON.stringify(res)
  },
})
