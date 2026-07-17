import { application, Response } from "express";
import { AuthRequest } from "../middleware/authMiddlewares.js";
import { GoogleGenAI } from "@google/genai";
import axios from "axios";
import { cloudinary } from "../config/cloudinary.js";
import { Generation } from "../Models/Generatrions.js";
import { Post } from "../Models/post.js";
import { resolve } from "node:dns";

//hleper to call leonardo ai



const leonardoJob = async (
  generationId: string,
  apiKey: string,
): Promise<string> => {
  const maxRetries = 20;
  const delay = 5000;

  for (let i = 0; i < maxRetries; i++) {
    try {
     

      const response = await axios.get(
        `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
        },
      );

      const generation = response.data?.generations_by_pk;

      if (!generation) {
        throw new Error("No generation data returned from Leonardo");
      }

      

      if (generation.status === "COMPLETE") {
        
        

        if (
          generation.generated_images &&
          generation.generated_images.length > 0
        ) {
          return generation.generated_images[0].url;
        }

        throw new Error("Generation completed but no image URL found");
      }

      if (generation.status === "FAILED") {
        throw new Error("Leonardo AI generation failed");
      }

      
    } catch (error: any) {
      console.error(
        "Polling Error:",
        error?.response?.data || error?.message || error,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error("Leonardo AI generation timed out");
};

export default leonardoJob;

// Generate posts
//POST /api/posts/generate

export const generatePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { prompt, tone, generateImage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(400).json({
        message: "Gemini api key is missing.Please add it to server/.env file.",
      });
      return;
    }
    const ai = new GoogleGenAI({ apiKey });

    //Geneerate text
    const textResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
    Generate a social media post based on this prompt: "${prompt}".
    
    Tone: ${tone}.
    
    Requirements:
    - Include relevant hashtags.
    - Format the response as valid JSON.
    - Return only JSON, no additional text.
    
    JSON structure:
    {
      "content": "The social media post content",
      "imagePrompt": "A highly detailed image generation prompt that complements the post"
    }
    
    The "imagePrompt" should be highly descriptive and suitable for AI image generators such as Gemini, Leonardo AI, Midjourney, or Flux.
    `,
    });

    let content = "";
    let imagePrompt = prompt;

    try {
      const rawText = textResponse.text || "";
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const data = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { constent: rawText, imagePrompt: prompt };
      content = data.content;
      imagePrompt = data.imagePrompt;
    } catch (e) {
      content = textResponse.text || "";
    }

    let mediaUrl = "";
    if (generateImage) {
      try {
        const leonardoKey = process.env.LEONARDO_API_KEY;

        if (leonardoKey) {
          // Use Leonardo AI for image generation
          const leoResponse = await axios.post(
            "https://cloud.leonardo.ai/api/rest/v2/generations",
            {
              public: false,
              model: "gpt-image-2",
              parameters: {
                quality: "LOW",
                prompt: imagePrompt,
                quantity: 1,
                width: 1024,
                height: 1024,
                prompt_enhance: "OFF",
              },
            },
            {
              headers: {
                Accept: "application/json",
                Authorization: `Bearer ${leonardoKey}`,
                "Content-Type": "application/json",
              },
            },
          );
          const generationID = leoResponse.data.generate.generationId;

          const tempUrl = await leonardoJob(generationID, leonardoKey);

          //upload to cloudinary for persistance
          const uploadResult = await cloudinary.uploader.upload(tempUrl, {
            folder: "ai-generations",
          });
          mediaUrl = uploadResult.secure_url;
        }
      } catch (error: any) {
        console.error(
          "Leonardo API Error:",
          error.response?.data || error.message,
        );
      }
    }

    // save generation to db

    const generation = await Generation.create({
      user: req.user._id,
      prompt,
      content,
      mediaUrl,
      
      mediaType: mediaUrl ? "image" : undefined,
    });

    res.json(generation);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "server error" });
  }
};

// get Generations
//GET /api/posts/generations

export const getGenerations = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const generations = await Generation.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(generations);
  } catch (error: any) {
    res.status(500).json({ messgae: error?.message || "server error" });
  }
};

// get posts
//GET /api/posts

export const getPosts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const posts = await Post.find({ user: req.user._id });
    res.json(posts);
  } catch (error: any) {
    res.status(500).json({ messgae: error?.message || "server error" });
  }
};

// schedule posts
//POST /api/posts

export const schedulePost = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { content, platforms, scheduledFor, status } = req.body;

    let parsedPlatforms = platforms;

    if (typeof platforms === "string") {
      try {
        parsedPlatforms = JSON.parse(platforms);
      } catch {
        parsedPlatforms = platforms.split(",");
      }
    }

    let mediaUrl: string | undefined = req.body.mediaUrl;
    let mediaType: "image" | "video" | undefined = req.body.mediaType;

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(
        `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`,
        {
          resource_type: "image",
        }
      );
    
      console.log("UPLOAD RESULT:", uploadResult);
    
      mediaUrl = uploadResult.secure_url;
      mediaType = "image";
    }
    console.log("REQ BODY:", req.body);

console.log({
  content,
  platforms: parsedPlatforms,
  scheduledFor,
  status,
  mediaUrl,
  mediaType,
});

    const post = await Post.create({
      user: req.user._id,
      content,
      platforms: parsedPlatforms,
      mediaUrl,
      mediaType,
      scheduledFor,
      status,
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error("SCHEDULE POST ERROR:", error);

    res.status(500).json({
      message: error?.message || "Server Error",
    });
  }
};
