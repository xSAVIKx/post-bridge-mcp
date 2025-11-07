// src/server.ts
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { FastMCP } from "fastmcp";
import {
  CreateUploadUrlDtoMimeTypeEnum
} from "post-bridge-api";
import { z as z2 } from "zod";
// package.json
var version = "0.1.5";

// src/api.ts
import {
  createConfiguration,
  MediaApi,
  PostResultsApi,
  PostsApi,
  ServerConfiguration,
  SocialAccountsApi
} from "post-bridge-api";
function getApiConfig() {
  const baseUrl = process.env.POST_BRIDGE_API_BASE_URL ?? "https://api.post-bridge.com";
  const token = process.env.POST_BRIDGE_API_TOKEN;
  if (!token) {
    throw new Error("API token is required. Please set the POST_BRIDGE_API_TOKEN environment variable.");
  }
  const baseServer = new ServerConfiguration(baseUrl, {});
  const confParams = {
    baseServer,
    authMethods: {
      bearer: {
        tokenProvider: {
          getToken: () => token
        }
      }
    }
  };
  return createConfiguration(confParams);
}
var config = getApiConfig();
var socialAccountsApi = new SocialAccountsApi(config);
var postsApi = new PostsApi(config);
var postResultsApi = new PostResultsApi(config);
var mediaApi = new MediaApi(config);

// src/schemas.ts
import { z } from "zod";
var ThreadsLocationEnum = z.enum(["reels", "timeline"]).describe('Threads post location: "reels" (short vertical video) or "timeline" (standard feed).');
var BlueskyConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Bluesky."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Bluesky. Use media IDs from Post Bridge.")
}).strict().describe("Bluesky-specific overrides applied when posting to Bluesky. Unknown keys are rejected.");
var FacebookConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Facebook."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Facebook. Use media IDs from Post Bridge."),
  placement: z.string().optional().describe("Facebook placement type (e.g., feed, reels). If omitted, default placement is used.")
}).strict().describe("Facebook-specific overrides applied when posting to Facebook. Unknown keys are rejected.");
var InstagramConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Instagram."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Instagram. Use media IDs from Post Bridge."),
  videoCoverTimestampMs: z.number().int().nonnegative().optional().describe("Video cover timestamp in milliseconds. Must be >= 0."),
  placement: z.string().optional().describe("Instagram placement type (e.g., feed, reels). If omitted, default placement is used.")
}).strict().describe("Instagram-specific overrides applied when posting to Instagram. Unknown keys are rejected.");
var LinkedinConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for LinkedIn."),
  media: z.array(z.string()).optional().describe("Overrides the post media for LinkedIn. Use media IDs from Post Bridge.")
}).strict().describe("LinkedIn-specific overrides applied when posting to LinkedIn. Unknown keys are rejected.");
var PinterestConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Pinterest."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Pinterest. Use media IDs from Post Bridge."),
  boardIds: z.array(z.string()).optional().describe("Pinterest board IDs to publish to. If omitted, the default board is used."),
  link: z.url().optional().describe("Destination URL for the Pin. Must be a valid URL."),
  videoCoverTimestampMs: z.number().int().nonnegative().optional().describe("Video cover timestamp in milliseconds. Must be >= 0."),
  title: z.string().optional().describe("Title for the Pin.")
}).strict().describe("Pinterest-specific overrides applied when posting to Pinterest. Unknown keys are rejected.");
var ThreadsConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Threads."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Threads. Use media IDs from Post Bridge."),
  location: ThreadsLocationEnum.optional().describe('Threads post location. Choose "reels" for Reels or "timeline" for the standard feed.')
}).strict().describe("Threads-specific overrides applied when posting to Threads. Unknown keys are rejected.");
var TiktokConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for TikTok."),
  media: z.array(z.string()).optional().describe("Overrides the post media for TikTok. Use media IDs from Post Bridge."),
  title: z.string().optional().describe("Overrides the post title for TikTok."),
  videoCoverTimestampMs: z.number().int().nonnegative().optional().describe("Video cover timestamp in milliseconds. Must be >= 0."),
  draft: z.boolean().optional().describe("If true, the post will be saved as a draft instead of publishing immediately."),
  isAigc: z.boolean().optional().describe('If true, marks the video with the "Creator labeled as AI-generated" tag.')
}).strict().describe("TikTok-specific overrides applied when posting to TikTok. Unknown keys are rejected.");
var TwitterConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post caption for Twitter/X."),
  media: z.array(z.string()).optional().describe("Overrides the post media for Twitter/X. Use media IDs from Post Bridge.")
}).strict().describe("Twitter/X-specific overrides applied when posting to Twitter. Unknown keys are rejected.");
var YoutubeConfigurationSchema = z.object({
  caption: z.string().optional().describe("Overrides the post description for YouTube."),
  media: z.array(z.string()).optional().describe("Overrides the post media for YouTube (e.g., video). Use media IDs from Post Bridge."),
  title: z.string().optional().describe("Overrides the video title for YouTube.")
}).strict().describe("YouTube-specific overrides applied when posting to YouTube. Unknown keys are rejected.");
var PlatformConfigurationsSchema = z.object({
  pinterest: PinterestConfigurationSchema.optional().describe("Pinterest configuration. Applies only to Pinterest posts."),
  instagram: InstagramConfigurationSchema.optional().describe("Instagram configuration. Applies only to Instagram posts."),
  tiktok: TiktokConfigurationSchema.optional().describe("TikTok configuration. Applies only to TikTok posts."),
  twitter: TwitterConfigurationSchema.optional().describe("Twitter/X configuration. Applies only to Twitter (X) posts."),
  youtube: YoutubeConfigurationSchema.optional().describe("YouTube configuration. Applies only to YouTube posts."),
  facebook: FacebookConfigurationSchema.optional().describe("Facebook configuration. Applies only to Facebook posts."),
  linkedin: LinkedinConfigurationSchema.optional().describe("LinkedIn configuration. Applies only to LinkedIn posts."),
  bluesky: BlueskyConfigurationSchema.optional().describe("Bluesky configuration. Applies only to Bluesky posts."),
  threads: ThreadsConfigurationSchema.optional().describe("Threads configuration. Applies only to Threads posts.")
}).strict().describe('Platform-specific overrides per network. Only provided keys will apply; others inherit the post-level fields. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }');

// src/server.ts
var server = new FastMCP({
  name: "post-bridge MCP",
  version
});
server.addTool({
  name: "socialAccounts_list",
  description: "List social accounts from Post Bridge with optional filters: platform(s), username(s), and pagination.",
  parameters: z2.object({
    offset: z2.number().int().nonnegative().default(0).describe("Number of items to skip"),
    limit: z2.number().int().positive().max(200).default(50).describe("Number of items to return (max 200)."),
    platform: z2.array(z2.string()).nonempty().optional().describe('Filter by platform(s). Examples: ["twitter"], ["twitter","instagram"].'),
    username: z2.array(z2.string()).nonempty().optional().describe('Filter by username(s). Examples: ["alice"], ["alice","bob"].')
  }),
  execute: async (args) => {
    const { offset, limit, platform, username } = args;
    const res = await socialAccountsApi.socialAccountsControllerGetAllSocialAccountsV1(offset, limit, platform, username);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "socialAccounts_get",
  description: "Get a single social account by its numeric ID from Post Bridge.",
  parameters: z2.object({
    id: z2.number().int().positive().describe("Social Account ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await socialAccountsApi.socialAccountsControllerGetSocialAccountV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "posts_list",
  description: "Get a paginated result for posts with optional platform and status filters.",
  parameters: z2.object({
    offset: z2.number().int().nonnegative().default(0).describe("Number of items to skip"),
    limit: z2.number().int().positive().max(200).default(50).describe("Number of items to return"),
    platform: z2.array(z2.enum([
      "bluesky",
      "facebook",
      "instagram",
      "linkedin",
      "pinterest",
      "threads",
      "tiktok",
      "twitter",
      "youtube"
    ])).nonempty().optional().describe("Filter by platforms. Multiple values imply OR logic."),
    status: z2.array(z2.enum(["posted", "scheduled", "processing"])).nonempty().optional().describe("Filter by post status. Multiple values imply OR logic.")
  }),
  execute: async (args) => {
    const { offset, limit, platform, status } = args;
    const res = await postsApi.postsControllerGetAllPostsV1(offset, limit, platform, status);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "posts_get",
  description: "Get a single post by ID.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Post ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await postsApi.postsControllerGetPostV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "posts_create",
  description: "Create a new post. For local media files, use media_upload tool first to get media IDs, then pass them here.",
  parameters: z2.object({
    caption: z2.string().min(1).describe("Caption text for the post"),
    scheduledAt: z2.iso.datetime().optional().describe("ISO datetime string. Omit to post instantly."),
    platformConfigurations: PlatformConfigurationsSchema.optional().describe('Platform-specific configurations overriding post-level fields per network. Only provided keys apply. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }'),
    accountConfigurations: z2.array(z2.any()).optional().describe("Account-specific configurations"),
    media: z2.array(z2.string()).optional().describe("Array of media IDs (use media_upload tool to upload local files first)"),
    mediaUrls: z2.array(z2.url()).optional().describe("Array of publicly accessible media URLs associated with the post; ignored if media is provided."),
    socialAccounts: z2.array(z2.number().int().positive()).nonempty().describe("Array of social account IDs for posting"),
    isDraft: z2.boolean().optional().describe("If true, creates the post as a draft (not processed until updated with a schedule or posted instantly)."),
    processingEnabled: z2.boolean().optional().describe("If true, enable video processing to maximize compatibility; if false, skip video processing.")
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
      processingEnabled
    } = args;
    const dto = {
      caption,
      socialAccounts,
      isDraft,
      processingEnabled
    };
    if (scheduledAt)
      dto.scheduledAt = new Date(scheduledAt);
    if (platformConfigurations !== undefined)
      dto.platformConfigurations = platformConfigurations;
    if (accountConfigurations !== undefined)
      dto.accountConfigurations = accountConfigurations;
    if (media !== undefined)
      dto.media = media;
    if (mediaUrls !== undefined)
      dto.mediaUrls = mediaUrls;
    const res = await postsApi.postsControllerCreatePostsV1(dto);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "posts_update",
  description: "Update an existing post. If updating a 'scheduled' post, always pass 'scheduledAt' to keep schedule.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Post ID"),
    caption: z2.string().optional().describe("New caption text for the post. Omit to leave unchanged."),
    scheduledAt: z2.union([z2.iso.datetime(), z2.null()]).optional().describe("Set to ISO datetime string to schedule, null to post instantly. If updating a scheduled post and you want to keep the schedule, pass the existing scheduled time."),
    platformConfigurations: PlatformConfigurationsSchema.optional().describe('Platform-specific configurations overriding post-level fields per network. Only provided keys apply. Example: { "instagram": { "placement": "reels" }, "tiktok": { "draft": true } }'),
    accountConfigurations: z2.array(z2.any()).optional().describe("Account-specific configurations. Omit to leave unchanged."),
    media: z2.array(z2.string()).optional().describe("Array of media IDs associated with the post. Omit to leave unchanged."),
    mediaUrls: z2.array(z2.url()).optional().describe("Array of publicly accessible media URLs. Ignored if media is provided. Omit to leave unchanged."),
    socialAccounts: z2.array(z2.number().int().positive()).optional().describe("Array of social account IDs for posting. Omit to leave unchanged."),
    isDraft: z2.boolean().optional().describe("If true, keeps the post as a draft; if false, ensures it will be processed (subject to schedule). Omit to leave unchanged."),
    processingEnabled: z2.boolean().optional().describe("If true, enable video processing to improve compatibility; if false, skip video processing. Omit to leave unchanged.")
  }),
  execute: async (args) => {
    const { id, ...rest } = args;
    const dto = {};
    if (rest.caption !== undefined)
      dto.caption = rest.caption;
    if ("scheduledAt" in rest)
      dto.scheduledAt = rest.scheduledAt === null ? null : new Date(rest.scheduledAt);
    if (rest.platformConfigurations !== undefined)
      dto.platformConfigurations = rest.platformConfigurations;
    if (rest.accountConfigurations !== undefined)
      dto.accountConfigurations = rest.accountConfigurations;
    if (rest.media !== undefined)
      dto.media = rest.media;
    if (rest.mediaUrls !== undefined)
      dto.mediaUrls = rest.mediaUrls;
    if (rest.socialAccounts !== undefined)
      dto.socialAccounts = rest.socialAccounts;
    if (rest.isDraft !== undefined)
      dto.isDraft = rest.isDraft;
    if (rest.processingEnabled !== undefined)
      dto.processingEnabled = rest.processingEnabled;
    const res = await postsApi.postsControllerUpdatePostV1(id, dto);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "posts_delete",
  description: "Delete a post by ID.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Post ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await postsApi.postsControllerDeletePostV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "postResults_list",
  description: "Get a paginated result for post results with optional filters.",
  parameters: z2.object({
    offset: z2.number().int().nonnegative().default(0).describe("Number of items to skip"),
    limit: z2.number().int().positive().max(200).default(50).describe("Number of items to return"),
    postId: z2.array(z2.string()).nonempty().optional().describe("Filter by post IDs"),
    platform: z2.array(z2.string()).nonempty().optional().describe("Filter by platforms")
  }),
  execute: async (args) => {
    const { offset, limit, postId, platform } = args;
    const res = await postResultsApi.postResultsControllerGetAllPostResultsV1(offset, limit, postId, platform);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "postResults_get",
  description: "Get a post result by ID.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Post Result ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await postResultsApi.postResultsControllerGetPostResultV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "media_createUploadUrl",
  description: "Create a signed upload URL to upload media.",
  parameters: z2.object({
    name: z2.string().min(1).describe("Original file name (used for extension)"),
    mimeType: z2.enum([
      "image/png",
      "image/jpeg",
      "video/mp4",
      "video/quicktime"
    ]).describe("MIME type of the media file"),
    sizeBytes: z2.number().int().positive().describe("Size of the media file in bytes")
  }),
  execute: async (args) => {
    const { name, mimeType, sizeBytes } = args;
    const dto = { name, mimeType, sizeBytes };
    const res = await mediaApi.mediaControllerCreateUploadUrlV1(dto);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "media_delete",
  description: "Delete media by ID.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Media ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await mediaApi.mediaControllerDeleteMediaV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "media_get",
  description: "Get media by ID.",
  parameters: z2.object({
    id: z2.string().min(1).describe("Media ID")
  }),
  execute: async (args) => {
    const { id } = args;
    const res = await mediaApi.mediaControllerGetMediaByIdV1(id);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "media_list",
  description: "Get a paginated result for media with optional filters.",
  parameters: z2.object({
    offset: z2.number().int().nonnegative().default(0).describe("Number of items to skip"),
    limit: z2.number().int().positive().max(200).default(50).describe("Number of items to return"),
    postId: z2.array(z2.string()).nonempty().optional().describe("Filter by post IDs"),
    type: z2.array(z2.enum(["image", "video"])).nonempty().optional().describe("Filter by media types")
  }),
  execute: async (args) => {
    const { offset, limit, postId, type } = args;
    const res = await mediaApi.mediaControllerGetMediaV1(offset, limit, postId, type);
    return JSON.stringify(res);
  }
});
server.addTool({
  name: "media_upload",
  description: "Upload a media file from local filesystem. Handles the entire upload process and returns the media ID.",
  parameters: z2.object({
    filePath: z2.string().min(1).describe("Absolute or relative path to the media file on the local filesystem")
  }),
  execute: async (args) => {
    const { filePath } = args;
    try {
      const stats = await fs.stat(filePath);
      const sizeBytes = stats.size;
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      let mimeType;
      switch (ext) {
        case ".png":
          mimeType = CreateUploadUrlDtoMimeTypeEnum.ImagePng;
          break;
        case ".jpg":
        case ".jpeg":
          mimeType = CreateUploadUrlDtoMimeTypeEnum.ImageJpeg;
          break;
        case ".mp4":
          mimeType = CreateUploadUrlDtoMimeTypeEnum.VideoMp4;
          break;
        case ".mov":
          mimeType = CreateUploadUrlDtoMimeTypeEnum.VideoQuicktime;
          break;
        default:
          throw new Error(`Unsupported file type: ${ext}. Supported types: .png, .jpg, .jpeg, .mp4, .mov`);
      }
      const uploadResponse = await mediaApi.mediaControllerCreateUploadUrlV1({
        name: fileName,
        mimeType,
        sizeBytes
      });
      const fileBuffer = await fs.readFile(filePath);
      const uploadResult = await fetch(uploadResponse.uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType
        },
        body: fileBuffer
      });
      if (!uploadResult.ok) {
        throw new Error(`Upload failed with status ${uploadResult.status}: ${await uploadResult.text()}`);
      }
      return JSON.stringify({
        mediaId: uploadResponse.mediaId,
        fileName,
        mimeType,
        sizeBytes,
        success: true
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
});
export {
  server
};
