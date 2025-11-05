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

// Zod schemas mirroring post-bridge-api platform configuration DTOs
const ThreadsLocationEnum = z
  .enum(['reels', 'timeline'] as const)
  .describe(
    'Threads post location: "reels" (short vertical video) or "timeline" (standard feed).',
  )

const BlueskyConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Bluesky.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Bluesky. Use media IDs from Post Bridge.',
      ),
  })
  .strict()
  .describe(
    'Bluesky-specific overrides applied when posting to Bluesky. Unknown keys are rejected.',
  )

const FacebookConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Facebook.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Facebook. Use media IDs from Post Bridge.',
      ),
    placement: z
      .string()
      .optional()
      .describe(
        'Facebook placement type (e.g., feed, reels). If omitted, default placement is used.',
      ),
  })
  .strict()
  .describe(
    'Facebook-specific overrides applied when posting to Facebook. Unknown keys are rejected.',
  )

const InstagramConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Instagram.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Instagram. Use media IDs from Post Bridge.',
      ),
    videoCoverTimestampMs: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Video cover timestamp in milliseconds. Must be >= 0.'),
    placement: z
      .string()
      .optional()
      .describe(
        'Instagram placement type (e.g., feed, reels). If omitted, default placement is used.',
      ),
  })
  .strict()
  .describe(
    'Instagram-specific overrides applied when posting to Instagram. Unknown keys are rejected.',
  )

const LinkedinConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for LinkedIn.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for LinkedIn. Use media IDs from Post Bridge.',
      ),
  })
  .strict()
  .describe(
    'LinkedIn-specific overrides applied when posting to LinkedIn. Unknown keys are rejected.',
  )

const PinterestConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Pinterest.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Pinterest. Use media IDs from Post Bridge.',
      ),
    boardIds: z
      .array(z.string())
      .optional()
      .describe(
        'Pinterest board IDs to publish to. If omitted, the default board is used.',
      ),
    link: z
      .url()
      .optional()
      .describe('Destination URL for the Pin. Must be a valid URL.'),
    videoCoverTimestampMs: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Video cover timestamp in milliseconds. Must be >= 0.'),
    title: z.string().optional().describe('Title for the Pin.'),
  })
  .strict()
  .describe(
    'Pinterest-specific overrides applied when posting to Pinterest. Unknown keys are rejected.',
  )

const ThreadsConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Threads.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Threads. Use media IDs from Post Bridge.',
      ),
    location: ThreadsLocationEnum.optional().describe(
      'Threads post location. Choose "reels" for Reels or "timeline" for the standard feed.',
    ),
  })
  .strict()
  .describe(
    'Threads-specific overrides applied when posting to Threads. Unknown keys are rejected.',
  )

const TiktokConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for TikTok.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for TikTok. Use media IDs from Post Bridge.',
      ),
    title: z
      .string()
      .optional()
      .describe('Overrides the post title for TikTok.'),
    videoCoverTimestampMs: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .describe('Video cover timestamp in milliseconds. Must be >= 0.'),
    draft: z
      .boolean()
      .optional()
      .describe(
        'If true, the post will be saved as a draft instead of publishing immediately.',
      ),
    isAigc: z
      .boolean()
      .optional()
      .describe(
        'If true, marks the video with the "Creator labeled as AI-generated" tag.',
      ),
  })
  .strict()
  .describe(
    'TikTok-specific overrides applied when posting to TikTok. Unknown keys are rejected.',
  )

const TwitterConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post caption for Twitter/X.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for Twitter/X. Use media IDs from Post Bridge.',
      ),
  })
  .strict()
  .describe(
    'Twitter/X-specific overrides applied when posting to Twitter. Unknown keys are rejected.',
  )

const YoutubeConfigurationSchema = z
  .object({
    caption: z
      .string()
      .optional()
      .describe('Overrides the post description for YouTube.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Overrides the post media for YouTube (e.g., video). Use media IDs from Post Bridge.',
      ),
    title: z
      .string()
      .optional()
      .describe('Overrides the video title for YouTube.'),
  })
  .strict()
  .describe(
    'YouTube-specific overrides applied when posting to YouTube. Unknown keys are rejected.',
  )

const PlatformConfigurationsSchema = z
  .object({
    pinterest: PinterestConfigurationSchema.optional().describe(
      'Pinterest configuration. Applies only to Pinterest posts.',
    ),
    instagram: InstagramConfigurationSchema.optional().describe(
      'Instagram configuration. Applies only to Instagram posts.',
    ),
    tiktok: TiktokConfigurationSchema.optional().describe(
      'TikTok configuration. Applies only to TikTok posts.',
    ),
    twitter: TwitterConfigurationSchema.optional().describe(
      'Twitter/X configuration. Applies only to Twitter (X) posts.',
    ),
    youtube: YoutubeConfigurationSchema.optional().describe(
      'YouTube configuration. Applies only to YouTube posts.',
    ),
    facebook: FacebookConfigurationSchema.optional().describe(
      'Facebook configuration. Applies only to Facebook posts.',
    ),
    linkedin: LinkedinConfigurationSchema.optional().describe(
      'LinkedIn configuration. Applies only to LinkedIn posts.',
    ),
    bluesky: BlueskyConfigurationSchema.optional().describe(
      'Bluesky configuration. Applies only to Bluesky posts.',
    ),
    threads: ThreadsConfigurationSchema.optional().describe(
      'Threads configuration. Applies only to Threads posts.',
    ),
  })
  .strict()
  .describe(
    'Platform-specific overrides per network. Only provided keys will apply; others inherit the post-level fields. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }',
  )

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
    scheduledAt: z.iso
      .datetime()
      .optional()
      .describe('ISO datetime string. Omit to post instantly.'),
    platformConfigurations: PlatformConfigurationsSchema.optional().describe(
      'Platform-specific configurations overriding post-level fields per network. Only provided keys apply. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }',
    ),
    accountConfigurations: z
      .array(z.any())
      .optional()
      .describe('Account-specific configurations'),
    media: z
      .array(z.string())
      .optional()
      .describe('Array of media IDs associated with the post'),
    mediaUrls: z
      .array(z.url())
      .optional()
      .describe(
        'Array of publicly accessible media URLs associated with the post; ignored if media is provided.',
      ),
    socialAccounts: z
      .array(z.number().int().positive())
      .nonempty()
      .describe('Array of social account IDs for posting'),
    isDraft: z
      .boolean()
      .optional()
      .describe(
        'If true, creates the post as a draft (not processed until updated with a schedule or posted instantly).',
      ),
    processingEnabled: z
      .boolean()
      .optional()
      .describe(
        'If true, enable video processing to maximize compatibility; if false, skip video processing.',
      ),
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
    caption: z
      .string()
      .optional()
      .describe('New caption text for the post. Omit to leave unchanged.'),
    scheduledAt: z
      .union([z.iso.datetime(), z.null()])
      .optional()
      .describe(
        'Set to ISO datetime string to schedule, null to post instantly. If updating a scheduled post and you want to keep the schedule, pass the existing scheduled time.',
      ),
    platformConfigurations: PlatformConfigurationsSchema.optional().describe(
      'Platform-specific configurations overriding post-level fields per network. Only provided keys apply. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }',
    ),
    accountConfigurations: z
      .array(z.any())
      .optional()
      .describe('Account-specific configurations. Omit to leave unchanged.'),
    media: z
      .array(z.string())
      .optional()
      .describe(
        'Array of media IDs associated with the post. Omit to leave unchanged.',
      ),
    mediaUrls: z
      .array(z.url())
      .optional()
      .describe(
        'Array of publicly accessible media URLs. Ignored if media is provided. Omit to leave unchanged.',
      ),
    socialAccounts: z
      .array(z.number().int().positive())
      .optional()
      .describe(
        'Array of social account IDs for posting. Omit to leave unchanged.',
      ),
    isDraft: z
      .boolean()
      .optional()
      .describe(
        'If true, keeps the post as a draft; if false, ensures it will be processed (subject to schedule). Omit to leave unchanged.',
      ),
    processingEnabled: z
      .boolean()
      .optional()
      .describe(
        'If true, enable video processing to improve compatibility; if false, skip video processing. Omit to leave unchanged.',
      ),
  }),
  execute: async (args) => {
    const { id, ...rest } = args as {
      id: string
      caption?: string
      scheduledAt?: string | null
      platformConfigurations?: PlatformConfigurationsDto
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
