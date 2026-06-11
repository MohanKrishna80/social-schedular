import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../Models/user.js";

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token" });
    }

    const token = authHeader.split(" ")[1];

    const decoded: any = jwt.verify(
      token,
      process.env.JWT_SECRET!
    );

    const user = await User.findById(decoded.id).select(
      "-password"
    );

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found" });
    }

    req.user = user;

    console.log("Authenticated User:", user._id);

    next();
  } catch (error: any) {
    return res.status(401).json({
      message:
        error?.message || "Not authorized, token failed",
    });
  }
};