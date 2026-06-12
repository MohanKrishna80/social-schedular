//Get all acounts

import { Request, Response } from "express";
import { Account } from "../Models/Account.js";
import { AuthRequest } from "../middleware/authMiddlewares.js";
import zernio from "../config/zernio.js";

// GET /api/accounts

export const getAccounts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
   

    const accounts = await Account.find({
      user: req.user._id,
    });

    

    res.json(accounts);
  } catch (error: any) {
   

    res.status(500).json({
      message: error?.message || "server error",
    });
  }
};

// add account

// POST api/accounts

export const addAccounts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { platform, handle, avatarUrl } = req.body;
    const account = await Account.create({
      user: req.user._id,
      platform,
      handle,
      avatarUrl,
    });

    account.save()

    res.status(201).json(account);
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "server error" });
  }
};

// Disconnect account

//DELETE  api/account/:id

export const disconnectAccounts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const account = await Account.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!account) {
      res.status(404).json({ message: "Account not found" });
      return;
    }
    if (account?.zernoiAccountId) {
      try {
        await zernio.accounts.deleteAccount({
          path: { accountId: account.zernoiAccountId },
        });
      } catch (error: any) {
        res.status(500).send(error?.response?.data?.message || error?.message);
        return;
      }
    }
    await account.deleteOne()
    res.json({message:"Account Disconnected Successfully"})
  } catch (error: any) {
    res.status(500).json({ message: error?.message || "server error" });
  }
};
