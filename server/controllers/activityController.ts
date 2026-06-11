//Get all activity
//GET /api/activity

import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddlewares.js";
import { ActivityLog } from "../Models/activityLog.js";

export const getActivity = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const activity = await ActivityLog.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(0)
      .populate("relatedPost", "content");
    res.json(activity);
  } catch (error: any) {
    res.status(500).json({ messgae: error?.message || "server error" });
  }
};
