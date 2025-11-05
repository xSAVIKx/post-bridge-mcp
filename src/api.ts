import {
  type Configuration,
  type ConfigurationParameters,
  createConfiguration,
  ServerConfiguration,
  SocialAccountsApi,
} from 'post-bridge-api'

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

const config = getApiConfig()

export const socialAccountsApi: SocialAccountsApi = new SocialAccountsApi(
  config,
)
