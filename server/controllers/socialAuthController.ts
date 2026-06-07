//

import { Request, Response } from "express";
import zernio from "../config/zernio.js";
import { User } from "../Models/user.js";
import { Account } from "../Models/Account.js";
import { AuthRequest } from "../middleware/authMiddlewares.js";

// Helper function to ensure user has a Zer io profile

const getOrCreateZernioProfile = async (user: any) => {
  try {
    const result = await zernio.profiles.listProfiles();
    const data = result.data as any;
    const profiles = Array.isArray(data)
      ? data
      : data?.profiles || data?.data || [];

    if (profiles.lengnth > 0) {
      const profileId = profiles[0]._id || profiles[0].id;

      await User.findByIdAndUpdate(user._id, { zernoiPtrofileId: profileId });
      return profileId;
    }

    const createResult = zernio.profiles.createProfile({
      body: { name: `${user.name}'s workspace` } as any,
    });

    const created = (createResult.data as any)?.profile || createResult.data;

    const profileId = created?._id || created.id;

    await User.findByIdAndUpdate(user._id, { zernoiPtrofileId: profileId });
    return profileId;
  } catch (error: any) {
    console.error("getOrCreateZernioProfile Error", error?.message || error);
    throw error;
  }
};

//Generate OAuth authotization URl
//GEt api/auth/:platform

export const generateAuthUrl = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { platform } = req.params;

    const profileId = await getOrCreateZernioProfile(req.user);

    const origin = req.headers.origin;

    const redirectUrl = `${origin}/accounts`;
    const result = await zernio.connect.getConnectUrl({
      path: { platform: platform as any },
      query: {
        profileId,
        redirect_url: redirectUrl,
      },
    });

    const data = result.data as any;

    console.log("getconnectUrl Responce:", JSON.stringify(data, null, 2));

    const authUrl = data.authUrl;

    if (!authUrl) {
      throw new Error(
        `zernio retuned no authUrl, Full responce:${JSON.stringify(data)}`,
      );
    }
    res.json({ url: authUrl });
  } catch (error: any) {
    res.status(500).json({ message: error.message || "server error" });
  }
};

//Sync connected accounts from zernio to MongoDB
// GEt /api/oauth/sync

export const syncAccounts = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profileId = await getOrCreateZernioProfile(req.user);

    const result = await zernio.accounts.listAccounts({
      query: { profileId } as any,
    });
    const data = result.data as any;
    const zernioAccounts: any[] =
      data?.accounts || Array.isArray(data) ? data : [];
    const supportedPlatforms = ["twitter", "linkedin", "facebook", "instagram"];
    const syncedAccounts = [];

    for (const zAccount of zernioAccounts) {
      const zId = zAccount._id || zAccount.id;

      if (!zId) {
        console.warn("Skipping account with no ID:", zAccount);
        continue;
      }

      const rawPlatforms = (
        zAccount.platform ||
        zAccount.type ||
        ""
      ).toLowerCase();

      const normalizedPlaforms = supportedPlatforms.find((p) =>
        rawPlatforms.includes(p),
      );
      if (!normalizedPlaforms) {
        console.log(`Skipping unsupported platform:"${rawPlatforms}"`);
        continue;
      }

      const account = await Account.findOneAndUpdate(
        { zernoiAccountId: zId },
        {
          user: req.user._id,
          platform: supportedPlatforms,
          handle:
            zAccount.username || zAccount.name || zAccount.handle || "Unknown",
          zernoiAccountId: zId,
          status: "connected",
          avatarUrl:
            zAccount.avatarUrl ||
            zAccount.picture ||
            zAccount.profile_image_url,
        },
        { upsert: true, returnDocument: "after" },
      );
      syncedAccounts.push(account);
    }
    res.json(syncedAccounts);
  } catch (error: any) {
    res.status(500).json({ message: error.message || "server error" });
  }
};
