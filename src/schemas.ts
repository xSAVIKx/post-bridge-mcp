import { z } from 'zod'

// Zod schemas mirroring post-bridge-api platform configuration DTOs
export const ThreadsLocationEnum: z.ZodTypeAny = z
  .enum(['reels', 'timeline'] as const)
  .describe(
    'Threads post location: "reels" (short vertical video) or "timeline" (standard feed).',
  )

export const BlueskyConfigurationSchema: z.ZodTypeAny = z
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

export const FacebookConfigurationSchema: z.ZodTypeAny = z
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

export const InstagramConfigurationSchema: z.ZodTypeAny = z
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

export const LinkedinConfigurationSchema: z.ZodTypeAny = z
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

export const PinterestConfigurationSchema: z.ZodTypeAny = z
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

export const ThreadsConfigurationSchema: z.ZodTypeAny = z
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

export const TiktokConfigurationSchema: z.ZodTypeAny = z
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

export const TwitterConfigurationSchema: z.ZodTypeAny = z
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

export const YoutubeConfigurationSchema: z.ZodTypeAny = z
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

export const PlatformConfigurationsSchema: z.ZodTypeAny = z
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
