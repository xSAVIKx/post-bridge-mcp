import { FastMCP } from 'fastmcp'
import type {
  CreatePostDto,
  CreateUploadUrlDto,
  PlatformConfigurationsDto,
  UpdatePostDto,
} from 'post-bridge-api'
import { z } from 'zod'
import { version } from '../package.json'
import { mediaApi, postResultsApi, postsApi, socialAccountsApi } from './api.ts'

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

// Posts
server.addTool({
  name: 'posts_list',
  description:
    'Get a paginated result for posts with optional platform and status filters.',
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
      .describe('Number of items to return'),
    platform: z
      .array(
        z.enum([
          'bluesky',
          'facebook',
          'instagram',
          'linkedin',
          'pinterest',
          'threads',
          'tiktok',
          'twitter',
          'youtube',
        ] as const),
      )
      .nonempty()
      .optional()
      .describe('Filter by platforms. Multiple values imply OR logic.'),
    status: z
      .array(z.enum(['posted', 'scheduled', 'processing'] as const))
      .nonempty()
      .optional()
      .describe('Filter by post status. Multiple values imply OR logic.'),
  }),
  execute: async (args) => {
    const { offset, limit, platform, status } = args as {
      offset?: number
      limit?: number
      platform?: (
        | 'bluesky'
        | 'facebook'
        | 'instagram'
        | 'linkedin'
        | 'pinterest'
        | 'threads'
        | 'tiktok'
        | 'twitter'
        | 'youtube'
      )[]
      status?: ('posted' | 'scheduled' | 'processing')[]
    }
    const res = await postsApi.postsControllerGetAllPostsV1(
      offset,
      limit,
      platform,
      status,
    )
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'posts_get',
  description: 'Get a single post by ID.',
  parameters: z.object({
    id: z.string().min(1).describe('Post ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: string }
    const res = await postsApi.postsControllerGetPostV1(id)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'posts_create',
  description: 'Create a new post.',
  parameters: z.object({
    caption: z.string().min(1).describe('Caption text for the post'),
    scheduledAt: z
      .string()
      .datetime()
      .optional()
      .describe('ISO datetime string. Omit to post instantly.'),
    platformConfigurations: z
      .any()
      .optional()
      .describe('Platform-specific configurations'),
    accountConfigurations: z
      .array(z.any())
      .optional()
      .describe('Account-specific configurations'),
    media: z
      .array(z.string())
      .optional()
      .describe('Array of media IDs associated with the post'),
    mediaUrls: z
      .array(z.string().url())
      .optional()
      .describe(
        'Array of publicly accessible media URLs associated with the post; ignored if media is provided.',
      ),
    socialAccounts: z
      .array(z.number().int().positive())
      .nonempty()
      .describe('Array of social account IDs for posting'),
    isDraft: z.boolean().optional(),
    processingEnabled: z.boolean().optional(),
  }),
  execute: async (args) => {
    const {
      caption,
      scheduledAt,
      platformConfigurations,
      accountConfigurations,
      media,
      mediaUrls,
      socialAccounts,
      isDraft,
      processingEnabled,
    } = args as {
      caption: string
      scheduledAt?: string
      platformConfigurations?: PlatformConfigurationsDto
      accountConfigurations?: unknown[]
      media?: string[]
      mediaUrls?: string[]
      socialAccounts: number[]
      isDraft?: boolean
      processingEnabled?: boolean
    }

    const dto: CreatePostDto = {
      caption,
      socialAccounts,
      isDraft,
      processingEnabled,
    }
    if (scheduledAt) dto.scheduledAt = new Date(scheduledAt)
    if (platformConfigurations !== undefined)
      dto.platformConfigurations = platformConfigurations
    if (accountConfigurations !== undefined)
      dto.accountConfigurations = accountConfigurations
    if (media !== undefined) dto.media = media
    if (mediaUrls !== undefined) dto.mediaUrls = mediaUrls

    const res = await postsApi.postsControllerCreatePostsV1(dto)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'posts_update',
  description:
    "Update an existing post. If updating a 'scheduled' post, always pass 'scheduledAt' to keep schedule.",
  parameters: z.object({
    id: z.string().min(1).describe('Post ID'),
    caption: z.string().optional(),
    scheduledAt: z
      .union([z.iso.datetime(), z.null()])
      .optional()
      .describe(
        'Set to ISO datetime string to schedule, null to post instantly.',
      ),
    platformConfigurations: z.any().optional(),
    accountConfigurations: z.array(z.any()).optional(),
    media: z.array(z.string()).optional(),
    mediaUrls: z.array(z.url()).optional(),
    socialAccounts: z.array(z.number().int().positive()).optional(),
    isDraft: z.boolean().optional(),
    processingEnabled: z.boolean().optional(),
  }),
  execute: async (args) => {
    const { id, ...rest } = args as {
      id: string
      caption?: string
      scheduledAt?: string | null
      platformConfigurations?: unknown
      accountConfigurations?: unknown[]
      media?: string[]
      mediaUrls?: string[]
      socialAccounts?: number[]
      isDraft?: boolean
      processingEnabled?: boolean
    }

    const dto: UpdatePostDto = {}
    if (rest.caption !== undefined) dto.caption = rest.caption
    if ('scheduledAt' in rest)
      dto.scheduledAt =
        rest.scheduledAt === null ? null : new Date(rest.scheduledAt as string)
    if (rest.platformConfigurations !== undefined)
      dto.platformConfigurations = rest.platformConfigurations
    if (rest.accountConfigurations !== undefined)
      dto.accountConfigurations = rest.accountConfigurations
    if (rest.media !== undefined) dto.media = rest.media
    if (rest.mediaUrls !== undefined) dto.mediaUrls = rest.mediaUrls
    if (rest.socialAccounts !== undefined)
      dto.socialAccounts = rest.socialAccounts
    if (rest.isDraft !== undefined) dto.isDraft = rest.isDraft
    if (rest.processingEnabled !== undefined)
      dto.processingEnabled = rest.processingEnabled

    const res = await postsApi.postsControllerUpdatePostV1(id, dto)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'posts_delete',
  description: 'Delete a post by ID.',
  parameters: z.object({
    id: z.string().min(1).describe('Post ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: string }
    const res = await postsApi.postsControllerDeletePostV1(id)
    return JSON.stringify(res)
  },
})

// Post Results
server.addTool({
  name: 'postResults_list',
  description: 'Get a paginated result for post results with optional filters.',
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
      .describe('Number of items to return'),
    postId: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe('Filter by post IDs'),
    platform: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe('Filter by platforms'),
  }),
  execute: async (args) => {
    const { offset, limit, postId, platform } = args as {
      offset?: number
      limit?: number
      postId?: string[]
      platform?: string[]
    }
    const res = await postResultsApi.postResultsControllerGetAllPostResultsV1(
      offset,
      limit,
      postId,
      platform,
    )
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'postResults_get',
  description: 'Get a post result by ID.',
  parameters: z.object({
    id: z.string().min(1).describe('Post Result ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: string }
    const res = await postResultsApi.postResultsControllerGetPostResultV1(id)
    return JSON.stringify(res)
  },
})

// Media
server.addTool({
  name: 'media_createUploadUrl',
  description: 'Create a signed upload URL to upload media.',
  parameters: z.object({
    name: z.string().min(1).describe('Original file name (used for extension)'),
    mimeType: z
      .enum([
        'image/png',
        'image/jpeg',
        'video/mp4',
        'video/quicktime',
      ] as const)
      .describe('MIME type of the media file'),
    sizeBytes: z
      .number()
      .int()
      .positive()
      .describe('Size of the media file in bytes'),
  }),
  execute: async (args) => {
    const { name, mimeType, sizeBytes } = args as CreateUploadUrlDto
    const dto = { name, mimeType, sizeBytes }
    const res = await mediaApi.mediaControllerCreateUploadUrlV1(dto)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'media_delete',
  description: 'Delete media by ID.',
  parameters: z.object({
    id: z.string().min(1).describe('Media ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: string }
    const res = await mediaApi.mediaControllerDeleteMediaV1(id)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'media_get',
  description: 'Get media by ID.',
  parameters: z.object({
    id: z.string().min(1).describe('Media ID'),
  }),
  execute: async (args) => {
    const { id } = args as { id: string }
    const res = await mediaApi.mediaControllerGetMediaByIdV1(id)
    return JSON.stringify(res)
  },
})

server.addTool({
  name: 'media_list',
  description: 'Get a paginated result for media with optional filters.',
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
      .describe('Number of items to return'),
    postId: z
      .array(z.string())
      .nonempty()
      .optional()
      .describe('Filter by post IDs'),
    type: z
      .array(z.enum(['image', 'video'] as const))
      .nonempty()
      .optional()
      .describe('Filter by media types'),
  }),
  execute: async (args) => {
    const { offset, limit, postId, type } = args as {
      offset?: number
      limit?: number
      postId?: string[]
      type?: ('image' | 'video')[]
    }
    const res = await mediaApi.mediaControllerGetMediaV1(
      offset,
      limit,
      postId,
      type,
    )
    return JSON.stringify(res)
  },
})
