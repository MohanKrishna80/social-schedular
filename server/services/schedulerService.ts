import cron from "node-cron";
import { Post } from "../Models/post.js";
import { Account } from "../Models/Account.js";

import zernio from "../config/zernio.js";
import { ActivityLog } from "../Models/activityLog.js";

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

          if (accounts.length === 0) {
            console.log(
              `No connected zernio accounts found for post ${post._id}`,
            );
            continue;
          }

          const zernioPlatforms = accounts.map((acc) => ({
            tform: acc.platform as any,
            accountId: acc.zernoiAccountId!,
          }));
          const payload = {
            content: post.content,
            publishNow: true,
            ...(post.mediaUrl
              ? {
                  mediaItems: [
                    { type: post.mediaType || "image", url: post.mediaUrl },
                  ],
                }
              : {}),
            platforms: zernioPlatforms,
          };
          console.log(
            `Publishing post ${post._id} to zernio with media :${post.mediaUrl || "none"}`,
          );

          const responce = await zernio.posts.createPost({
            body: payload,
          });

          const publishedPost = (responce.data as any)?.post || responce.data;

          if (!publishedPost) {
            throw new Error("Failed to get post object frolm Zernio responce");
          }
          console.log(
            `Zernio post created:${publishedPost._id || publishedPost.id}`,
          );
          post.status = "published";
          await post.save();
          await ActivityLog.create({
            user: post.user,
            actionType: "POST_PUBLISHED",
            description: `Published post to ${accounts.map((a) => a.platform).join(", ")}`,
            relatedPost: post._id,
          });
        } catch (err: any) {
          console.error(
            `failed to publish post ${post._id}:`,
            err?.responce?.data || err?.message,
          );
          post.status="failed"
          await post.save()
        }
        if(postsToPublish.length>0){
            console.log(`Evaluated ${postsToPublish.length} posts at ${now.toISOString()}`);
            
        }
      }
    } catch (error) {

        console.error("Error in scheduler",error);
        
    }
  });
  console.log("Scheduler Service initialized");
  
};
