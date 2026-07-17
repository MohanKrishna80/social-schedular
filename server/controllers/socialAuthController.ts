import { Response } from "express";
import zernio from "../config/zernio.js";
import { User } from "../Models/user.js";
import { Account } from "../Models/Account.js";
import { AuthRequest } from "../middleware/authMiddlewares.js";

// ---------------------------------------------
// Helper: Get or Create Zernio Profile
// ---------------------------------------------
const getOrCreateZernioProfile = async (user: any) => {
  try {
    const result = await zernio.profiles.listProfiles();

    const data = result.data as any;

    const profiles = Array.isArray(data)
      ? data
      : data?.profiles || data?.data || [];

    if (profiles.length > 0) {
      const profileId = profiles[0]._id || profiles[0].id;

      await User.findByIdAndUpdate(user._id, {
        zernoiPtrofileId: profileId, // Rename if your schema uses zernioProfileId
      });

      return profileId;
    }

    const createResult = await zernio.profiles.createProfile({
      body: {
        name: `${user.name}'s workspace`,
      } as any,
    });

    const created =
      (createResult.data as any)?.profile || createResult.data;

    const profileId = created?._id || created?.id;

    if (!profileId) {
      throw new Error("Failed to create Zernio profile");
    }

    await User.findByIdAndUpdate(user._id, {
      zernoiPtrofileId: profileId,
    });

    return profileId;
  } catch (error: any) {
    console.error(
      "getOrCreateZernioProfile Error:",
      error?.message || error
    );
    throw error;
  }
};

// ---------------------------------------------
// Generate OAuth Authorization URL
// GET /api/oauth/:platform
// ---------------------------------------------
export const generateAuthUrl = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { platform } = req.params;

    const profileId = await getOrCreateZernioProfile(req.user);

    const origin = req.headers.origin || process.env.CLIENT_URL;

    const redirectUrl = `${origin}/accounts`;

    const result = await zernio.connect.getConnectUrl({
      path: {
        platform: platform as any,
      },
      query: {
        profileId,
        redirect_url: redirectUrl,
      },
    });

    const data = result.data as any;

    const authUrl = data?.authUrl;

    if (!authUrl) {
      throw new Error(
        `Zernio returned no authUrl. Response: ${JSON.stringify(data)}`
      );
    }

    res.status(200).json({
      url: authUrl,
    });
  } catch (error: any) {
    console.error("Generate Auth URL Error:", error);

    res.status(500).json({
      message: error?.message || "Server Error",
    });
  }
};

// ---------------------------------------------
// Sync Connected Accounts
// GET /api/oauth/sync
// ---------------------------------------------
export const syncAccounts = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const profileId = await getOrCreateZernioProfile(req.user);

    const result = await zernio.accounts.listAccounts({
      query: {
        profileId,
      } as any,
    });

    const data = result.data as any;

    const zernioAccounts = Array.isArray(data)
      ? data
      : data?.accounts || [];

    const supportedPlatforms = [
      "twitter",
      "linkedin",
      "facebook",
      "instagram",
    ];

    const syncedAccounts = [];

    for (const zAccount of zernioAccounts) {
      const zId = zAccount._id || zAccount.id;

      if (!zId) {
        console.warn("Skipping account because account ID is missing.");
        continue;
      }

      const rawPlatform = (
        zAccount.platform ||
        zAccount.type ||
        ""
      )
        .toString()
        .toLowerCase();

      const normalizedPlatform = supportedPlatforms.find((platform) =>
        rawPlatform.includes(platform)
      );

      if (!normalizedPlatform) {
        console.warn(`Skipping unsupported platform: ${rawPlatform}`);
        continue;
      }

      const updatePayload = {
        user: req.user._id,
        platform: normalizedPlatform,
        handle:
          zAccount.username ||
          zAccount.name ||
          zAccount.handle ||
          "Unknown",
        zernoiAccountId: zId,
        status: "connected",
        avatarUrl:
          zAccount.avatarUrl ||
          zAccount.picture ||
          zAccount.profile_image_url ||
          "",
      };

      const account = await Account.findOneAndUpdate(
        {
          zernoiAccountId: zId,
        },
        updatePayload,
        {
          upsert: true,
          new: true,
        }
      );

      syncedAccounts.push(account);
    }

    res.status(200).json({
      success: true,
      count: syncedAccounts.length,
      accounts: syncedAccounts,
    });
  } catch (error: any) {
    console.error("Sync Accounts Error:", error);

    res.status(500).json({
      message: error?.message || "Server Error",
    });
  }
};
