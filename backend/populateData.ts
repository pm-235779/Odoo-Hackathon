import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const populateWithTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create test users and profiles
    const userNames = [
      "Alice Johnson", "Bob Smith", "Carol Davis", "David Wilson", "Emma Brown",
      "Frank Miller", "Grace Lee", "Henry Taylor", "Ivy Chen", "Jack Anderson",
      "Kate Thompson", "Liam Garcia", "Maya Patel", "Noah Rodriguez", "Olivia Martinez",
      "Paul Jackson", "Quinn White", "Ruby Harris", "Sam Clark", "Tina Lewis",
      "Uma Singh", "Victor Kim", "Wendy Hall", "Xavier Young", "Yara Allen",
      "Zoe King", "Alex Wright", "Blake Green", "Chloe Adams", "Dylan Baker",
      "Ella Cooper", "Felix Ward", "Gina Torres", "Hugo Reed", "Iris Murphy",
      "Jake Bell", "Luna Scott", "Max Turner", "Nora Phillips", "Oscar Evans",
      "Penny Collins", "Quincy Stewart", "Rose Morris", "Sean Rogers", "Tara Cook",
      "Ulysses Morgan", "Vera Bailey", "Wade Rivera", "Xara Cooper", "Yale Hughes"
    ];

    const createdUsers = [];
    
    for (let i = 0; i < Math.min(50, userNames.length); i++) {
      const name = userNames[i];
      const email = `${name.toLowerCase().replace(' ', '.')}@example.com`;
      
      // Create user
      const userId = await ctx.db.insert("users", {
        name,
        email,
        emailVerificationTime: Date.now(),
      });

      // Create profile
      await ctx.db.insert("profiles", {
        userId,
        displayName: name,
        bio: `Hi, I'm ${name.split(' ')[0]}! I love sustainable fashion and swapping clothes.`,
        location: ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"][i % 10],
        points: Math.floor(Math.random() * 200) + 50,
        totalItemsListed: Math.floor(Math.random() * 10),
        totalSwapsCompleted: Math.floor(Math.random() * 5),
        joinedAt: Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000, // Random date in past year
      });

      createdUsers.push(userId);
    }

    // Create test items
    const categories = ["tops", "bottoms", "dresses", "outerwear", "shoes", "accessories", "activewear"];
    const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
    const conditions = ["like-new", "excellent", "good", "fair"];
    const colors = ["Black", "White", "Blue", "Red", "Green", "Yellow", "Purple", "Pink", "Gray", "Brown"];
    const brands = ["Zara", "H&M", "Uniqlo", "Gap", "Nike", "Adidas", "Levi's", "Forever 21", "Urban Outfitters", "American Eagle"];

    const itemTitles = {
      tops: ["Cotton T-Shirt", "Silk Blouse", "Denim Shirt", "Sweater", "Tank Top", "Hoodie", "Cardigan", "Polo Shirt"],
      bottoms: ["Skinny Jeans", "Wide Leg Pants", "Shorts", "Leggings", "Chinos", "Joggers", "Skirt", "Cargo Pants"],
      dresses: ["Summer Dress", "Cocktail Dress", "Maxi Dress", "Midi Dress", "Wrap Dress", "Shift Dress", "A-Line Dress"],
      outerwear: ["Denim Jacket", "Leather Jacket", "Blazer", "Coat", "Puffer Jacket", "Trench Coat", "Cardigan"],
      shoes: ["Sneakers", "Boots", "Heels", "Flats", "Sandals", "Loafers", "Athletic Shoes", "Dress Shoes"],
      accessories: ["Handbag", "Scarf", "Belt", "Hat", "Sunglasses", "Watch", "Jewelry", "Backpack"],
      activewear: ["Yoga Pants", "Sports Bra", "Athletic Shorts", "Running Shirt", "Workout Leggings", "Track Jacket"]
    };

    const createdItems = [];

    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const titles = itemTitles[category as keyof typeof itemTitles];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = sizes[Math.floor(Math.random() * sizes.length)];
      const condition = conditions[Math.floor(Math.random() * conditions.length)];
      const uploaderId = createdUsers[Math.floor(Math.random() * createdUsers.length)];

      const itemId = await ctx.db.insert("items", {
        title: `${brand} ${color} ${title}`,
        description: `Beautiful ${color.toLowerCase()} ${title.toLowerCase()} from ${brand}. In ${condition} condition. Perfect for any occasion!`,
        category: category as any,
        type: title,
        size: size as any,
        condition: condition as any,
        brand,
        color,
        tags: [category, brand.toLowerCase(), color.toLowerCase(), condition],
        images: [], // No images for test data
        uploaderId,
        status: "approved", // Auto-approve test items
        pointValue: Math.floor(Math.random() * 30) + 10,
        views: Math.floor(Math.random() * 100),
        likes: [],
        isAvailable: true,
      });

      createdItems.push(itemId);
    }

    return {
      usersCreated: createdUsers.length,
      itemsCreated: createdItems.length,
    };
  },
});
