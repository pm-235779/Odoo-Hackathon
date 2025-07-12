import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculateRedemptionPoints } from "./points";

// Helper function to get user display name
function getUserDisplayName(uploader: any, profile: any): string {
  return uploader?.name || profile?.displayName || uploader?.email || "Anonymous";
}

// Get all approved items with pagination
export const getApprovedItems = query({
  args: {
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
    category: v.optional(v.union(
      v.literal("tops"),
      v.literal("bottoms"),
      v.literal("dresses"),
      v.literal("outerwear"),
      v.literal("shoes"),
      v.literal("accessories"),
      v.literal("activewear")
    )),
    size: v.optional(v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL"),
      v.literal("XXL"),
      v.literal("XXXL")
    )),
    condition: v.optional(v.union(
      v.literal("like-new"),
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "approved"))
      .filter((q) => q.eq(q.field("isAvailable"), true));

    if (args.category) {
      query = query.filter((q) => q.eq(q.field("category"), args.category));
    }
    if (args.size) {
      query = query.filter((q) => q.eq(q.field("size"), args.size));
    }
    if (args.condition) {
      query = query.filter((q) => q.eq(q.field("condition"), args.condition));
    }

    const result = await query.order("desc").paginate(args.paginationOpts);
    
    // Get uploader info and calculate redemption points for each item
    const itemsWithUploaders = await Promise.all(
      result.page.map(async (item) => {
        const uploader = await ctx.db.get(item.uploaderId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
          .first();
        
        // Calculate redemption points
        const redemptionPoints = calculateRedemptionPoints({
          category: item.category,
          condition: item.condition,
        });
        
        return {
          ...item,
          redemptionPoints,
          uploader: {
            name: getUserDisplayName(uploader, profile),
            avatar: profile?.avatar,
          },
        };
      })
    );

    return {
      ...result,
      page: itemsWithUploaders,
    };
  },
});

// Get item by ID with full details
export const getItemById = query({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.itemId);
    if (!item) return null;

    const uploader = await ctx.db.get(item.uploaderId);
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
      .first();

    // Get image URLs
    const imageUrls = await Promise.all(
      item.images.map(async (imageId) => {
        const url = await ctx.storage.getUrl(imageId);
        return url;
      })
    );

    // Calculate redemption points
    const redemptionPoints = calculateRedemptionPoints({
      category: item.category,
      condition: item.condition,
    });

    return {
      ...item,
      imageUrls,
      redemptionPoints,
      uploader: {
        id: item.uploaderId,
        name: getUserDisplayName(uploader, profile),
        avatar: profile?.avatar,
      },
    };
  },
});

// Search items
export const searchItems = query({
  args: {
    searchTerm: v.string(),
    category: v.optional(v.union(
      v.literal("tops"),
      v.literal("bottoms"),
      v.literal("dresses"),
      v.literal("outerwear"),
      v.literal("shoes"),
      v.literal("accessories"),
      v.literal("activewear")
    )),
    size: v.optional(v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL"),
      v.literal("XXL"),
      v.literal("XXXL")
    )),
    condition: v.optional(v.union(
      v.literal("like-new"),
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair")
    )),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("items")
      .withSearchIndex("search_items", (q) => {
        let searchQuery = q.search("title", args.searchTerm);
        if (args.category) {
          searchQuery = searchQuery.eq("category", args.category);
        }
        if (args.size) {
          searchQuery = searchQuery.eq("size", args.size);
        }
        if (args.condition) {
          searchQuery = searchQuery.eq("condition", args.condition);
        }
        return searchQuery.eq("status", "approved");
      });

    const items = await query.take(20);
    
    return Promise.all(
      items.map(async (item) => {
        const uploader = await ctx.db.get(item.uploaderId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
          .first();
        
        // Calculate redemption points
        const redemptionPoints = calculateRedemptionPoints({
          category: item.category,
          condition: item.condition,
        });
        
        return {
          ...item,
          redemptionPoints,
          uploader: {
            name: getUserDisplayName(uploader, profile),
            avatar: profile?.avatar,
          },
        };
      })
    );
  },
});

// Create new item
export const createItem = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("tops"),
      v.literal("bottoms"),
      v.literal("dresses"),
      v.literal("outerwear"),
      v.literal("shoes"),
      v.literal("accessories"),
      v.literal("activewear")
    ),
    type: v.string(),
    size: v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL"),
      v.literal("XXL"),
      v.literal("XXXL")
    ),
    condition: v.union(
      v.literal("like-new"),
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair")
    ),
    brand: v.optional(v.string()),
    color: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Calculate point value using the new system
    const pointValue = calculateRedemptionPoints({
      category: args.category,
      condition: args.condition,
    });

    const itemId = await ctx.db.insert("items", {
      ...args,
      uploaderId: userId,
      status: "pending",
      pointValue,
      views: 0,
      likes: [],
      isAvailable: false, // Will be true after approval
    });

    // Update user profile stats (but don't award points yet - only on approval)
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, {
        totalItemsListed: profile.totalItemsListed + 1,
      });
    }

    return itemId;
  },
});

// Get user's items
export const getUserItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const items = await ctx.db
      .query("items")
      .withIndex("by_uploader", (q) => q.eq("uploaderId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      items.map(async (item) => {
        const imageUrls = await Promise.all(
          item.images.slice(0, 1).map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        const uploader = await ctx.db.get(item.uploaderId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
          .first();

        // Calculate redemption points
        const redemptionPoints = calculateRedemptionPoints({
          category: item.category,
          condition: item.condition,
        });

        return {
          ...item,
          imageUrls,
          redemptionPoints,
          uploader: {
            name: getUserDisplayName(uploader, profile),
            avatar: profile?.avatar,
          },
        };
      })
    );
  },
});

// Generate upload URL for images
export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Toggle favorite
export const toggleFavorite = mutation({
  args: { itemId: v.id("items") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_item", (q) => 
        q.eq("userId", userId).eq("itemId", args.itemId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    } else {
      await ctx.db.insert("favorites", {
        userId,
        itemId: args.itemId,
      });
      return true;
    }
  },
});

// Get user favorites
export const getUserFavorites = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const items = await Promise.all(
      favorites.map(async (fav) => {
        const item = await ctx.db.get(fav.itemId);
        if (!item) return null;

        const imageUrls = await Promise.all(
          item.images.slice(0, 1).map(async (imageId) => {
            const url = await ctx.storage.getUrl(imageId);
            return url;
          })
        );

        const uploader = await ctx.db.get(item.uploaderId);
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
          .first();

        // Calculate redemption points
        const redemptionPoints = calculateRedemptionPoints({
          category: item.category,
          condition: item.condition,
        });

        return {
          ...item,
          imageUrls,
          redemptionPoints,
          uploader: {
            name: getUserDisplayName(uploader, profile),
            avatar: profile?.avatar,
          },
        };
      })
    );

    return items.filter(Boolean);
  },
});
