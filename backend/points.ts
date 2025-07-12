import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Award points to a user
export const awardPoints = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("item_listed"),
      v.literal("swap_completed"),
      v.literal("item_redeemed"),
      v.literal("bonus"),
      v.literal("referral")
    ),
    description: v.string(),
    relatedItemId: v.optional(v.id("items")),
    relatedSwapId: v.optional(v.id("swaps")),
  },
  handler: async (ctx, args) => {
    // Update user's total points
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        points: profile.points + args.amount,
      });
    }

    // Record the transaction
    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      amount: args.amount,
      type: args.type,
      description: args.description,
      relatedItemId: args.relatedItemId,
      relatedSwapId: args.relatedSwapId,
    });

    return profile?._id;
  },
});

// Deduct points from a user (for redemptions)
export const deductPoints = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    type: v.literal("item_redeemed"),
    description: v.string(),
    relatedItemId: v.optional(v.id("items")),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      throw new Error("User profile not found");
    }

    if (profile.points < args.amount) {
      throw new Error("Insufficient points");
    }

    // Update user's total points
    await ctx.db.patch(profile._id, {
      points: profile.points - args.amount,
    });

    // Record the transaction (negative amount)
    await ctx.db.insert("pointTransactions", {
      userId: args.userId,
      amount: -args.amount,
      type: args.type,
      description: args.description,
      relatedItemId: args.relatedItemId,
    });

    return profile._id;
  },
});

// Get leaderboard (top users by points, excluding admins and users with 0 points)
export const getLeaderboard = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.neq(q.field("isAdmin"), true))
      .order("desc")
      .take(50); // Get more to filter out 0 points

    // Get user info and filter out users with 0 points
    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: {
            name: user?.name,
            email: user?.email,
          },
        };
      })
    );

    // Filter out users with 0 points and sort by points in descending order
    return profilesWithUsers
      .filter((profile) => (profile.points || 0) > 0)
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 10);
  },
});

// Calculate redemption points based on item category and condition
export function calculateRedemptionPoints({ category, condition }: {
  category: string;
  condition: string;
}): number {
  const basePoints: Record<string, number> = {
    "tops": 15,
    "bottoms": 20,
    "dresses": 25,
    "outerwear": 30,
    "shoes": 20,
    "accessories": 10,
    "activewear": 18,
  };

  const conditionMultiplier: Record<string, number> = {
    "like-new": 1.0,
    "excellent": 0.9,
    "good": 0.8,
    "fair": 0.7,
  };

  const base = basePoints[category] || 15;
  const multiplier = conditionMultiplier[condition] || 0.8;
  
  return Math.round(base * multiplier);
}
