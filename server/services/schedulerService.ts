import cron from "node-cron";
import { Post } from "../Models/post.js";
import { Account } from "../Models/Account.js";

import zernio from "../config/zernio.js";
import { ActivityLog } from "../Models/activityLog.js";
import { platform } from "node:os";

export const initScheduler = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();
      const postsToPublish = await Post.find({
        status: "scheduled",
        scheduledFor: { $lte: now },
      });

      for (let post of postsToPublish) {
        try {
          const accounts = await Account.find({
            user: post.user,
            platform: { $in: post.platforms },
            status: "connected",
            zernoiAccountId: { $exists: true },
          });
      
          console.log("================================");
          console.log("POST ID:", post._id.toString());
          console.log("POST CONTENT:", post.content);
          console.log("MEDIA URL:", post.mediaUrl);
          console.log("MEDIA TYPE:", post.mediaType);
          console.log("PLATFORMS:", post.platforms);
          console.log("ACCOUNTS FOUND:", accounts.length);
      
          if (accounts.length === 0) {
            console.log(
              `No connected zernio accounts found for post ${post._id}`,
            );
            continue;
          }
      
          console.log(
            "CONNECTED ACCOUNTS:",
            accounts.map((a) => ({
              platform: a.platform,
              accountId: a.zernoiAccountId,
            })),
          );
      
          const zernioPlatforms = accounts.map((acc) => ({
            platform: acc.platform as any,
            accountId: acc.zernoiAccountId!,
          }));
      
          const payload = {
            content: post.content,
            publishNow: true,
            ...(post.mediaUrl
              ? {
                  mediaItems: [
                    {
                      type: post.mediaType || "image",
                      url: post.mediaUrl,
                    },
                  ],
                }
              : {}),
            platforms: zernioPlatforms,
          };
      
          console.log(
            "ZERNIO PAYLOAD:",
            JSON.stringify(payload, null, 2),
          );
      
          const response = await zernio.posts.createPost({
            body: payload,
          });
      
          console.log(
            "FULL ZERNIO RESPONSE:",
            JSON.stringify(response.data, null, 2),
          );
      
          const publishedPost =
            (response.data as any)?.post || response.data;
      
          if (!publishedPost) {
            throw new Error(
              "Failed to get post object from Zernio response",
            );
          }
      
          console.log(
            "ZERNIO POST CREATED:",
            publishedPost._id || publishedPost.id,
          );
      
          console.log(
            "ZERNIO STATUS:",
            publishedPost.status || "No status field",
          );
      
          post.status = "published";
          await post.save();
      
          console.log(
            `LOCAL POST ${post._id} MARKED AS PUBLISHED`,
          );
      
          await ActivityLog.create({
            user: post.user,
            actionType: "POST_PUBLISHED",
            description: `Published post to ${accounts
              .map((a) => a.platform)
              .join(", ")}`,
            relatedPost: post._id,
          });
        } catch (err: any) {
          console.log("========== ZERNIO ERROR ==========");
      
          console.error(
            "ERROR MESSAGE:",
            err?.message,
          );
      
          console.error(
            "ERROR RESPONSE:",
            JSON.stringify(
              err?.response?.data ||
                err?.data ||
                err,
              null,
              2,
            ),
          );
      
          post.status = "failed";
          await post.save();
      
          console.log(
            `LOCAL POST ${post._id} MARKED AS FAILED`,
          );
        }
      }
    } catch (error) {

        console.error("Error in scheduler",error);
        
    }
  });
  console.log("Scheduler Service initialized");
  
};
