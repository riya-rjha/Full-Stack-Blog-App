import express from "express";
import { blogModel } from "../Model/blog.js";
import { userModel } from "../Model/user.js";

const searchRouter = express.Router();

// Advanced search endpoint
searchRouter.get("/", async (req, res) => {
  try {
    const {
      q, // search query
      type = "all", // all, posts, users
      category,
      tags,
      author,
      dateFrom,
      dateTo,
      sortBy = "relevance", // relevance, date, views, likes
      order = "desc",
      page = 1,
      limit = 12
    } = req.query;

    const skip = (page - 1) * limit;
    let results = {};

    if (type === "posts" || type === "all") {
      // Build query for posts
      let postQuery = { isPublished: true };
      
      if (q) {
        postQuery.$text = { $search: q };
      }
      
      if (category) {
        postQuery.cat = category;
      }
      
      if (tags) {
        const tagArray = tags.split(",").map(tag => tag.trim());
        postQuery.tags = { $in: tagArray };
      }
      
      if (author) {
        const authorDoc = await userModel.findOne({ username: author });
        if (authorDoc) {
          postQuery.uid = authorDoc._id;
        }
      }
      
      if (dateFrom || dateTo) {
        postQuery.createdAt = {};
        if (dateFrom) postQuery.createdAt.$gte = new Date(dateFrom);
        if (dateTo) postQuery.createdAt.$lte = new Date(dateTo);
      }

      // Build sort criteria
      let sortCriteria = {};
      switch (sortBy) {
        case "relevance":
          if (q) {
            sortCriteria = { score: { $meta: "textScore" } };
          } else {
            sortCriteria = { createdAt: -1 };
          }
          break;
        case "date":
          sortCriteria = { createdAt: order === "desc" ? -1 : 1 };
          break;
        case "views":
          sortCriteria = { views: order === "desc" ? -1 : 1 };
          break;
        case "likes":
          sortCriteria = { likesCount: order === "desc" ? -1 : 1 };
          break;
        default:
          sortCriteria = { createdAt: -1 };
      }

      // Execute post search
      const postsQuery = blogModel
        .find(postQuery)
        .populate("uid", "username img firstName lastName")
        .sort(sortCriteria)
        .skip(skip)
        .limit(parseInt(limit));

      if (q && sortBy === "relevance") {
        postsQuery.select({ score: { $meta: "textScore" } });
      }

      const posts = await postsQuery;
      const totalPosts = await blogModel.countDocuments(postQuery);

      results.posts = {
        data: posts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalPosts / limit),
          total: totalPosts,
          hasNext: page * limit < totalPosts,
          hasPrev: page > 1
        }
      };
    }

    if (type === "users" || type === "all") {
      // Build query for users
      let userQuery = {};
      
      if (q) {
        userQuery.$or = [
          { username: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } },
          { bio: { $regex: q, $options: "i" } }
        ];
      }

      const users = await userModel
        .find(userQuery)
        .select("username img firstName lastName bio totalViews totalLikes")
        .sort({ totalViews: -1, totalLikes: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const totalUsers = await userModel.countDocuments(userQuery);

      results.users = {
        data: users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalUsers / limit),
          total: totalUsers,
          hasNext: page * limit < totalUsers,
          hasPrev: page > 1
        }
      };
    }

    return res.status(200).json(results);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get search suggestions (autocomplete)
searchRouter.get("/suggestions", async (req, res) => {
  try {
    const { q, limit = 5 } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(200).json({ suggestions: [] });
    }

    // Get post title suggestions
    const postSuggestions = await blogModel
      .find({ 
        title: { $regex: q, $options: "i" },
        isPublished: true 
      })
      .select("title")
      .limit(parseInt(limit));

    // Get tag suggestions
    const tagSuggestions = await blogModel.aggregate([
      { $unwind: "$tags" },
      { $match: { tags: { $regex: q, $options: "i" } } },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    // Get user suggestions
    const userSuggestions = await userModel
      .find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } }
        ]
      })
      .select("username firstName lastName")
      .limit(parseInt(limit));

    return res.status(200).json({
      suggestions: {
        posts: postSuggestions.map(post => ({
          type: "post",
          text: post.title,
          value: post.title
        })),
        tags: tagSuggestions.map(tag => ({
          type: "tag",
          text: tag._id,
          value: tag._id,
          count: tag.count
        })),
        users: userSuggestions.map(user => ({
          type: "user",
          text: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName} (@${user.username})`
            : `@${user.username}`,
          value: user.username
        }))
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get popular tags
searchRouter.get("/tags/popular", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const popularTags = await blogModel.aggregate([
      { $match: { isPublished: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    return res.status(200).json(
      popularTags.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get search analytics (for admin)
searchRouter.get("/analytics", async (req, res) => {
  try {
    // This could be expanded to track search queries in a separate collection
    const totalPosts = await blogModel.countDocuments({ isPublished: true });
    const totalUsers = await userModel.countDocuments();
    
    const categoryCounts = await blogModel.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$cat", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const tagCounts = await blogModel.aggregate([
      { $match: { isPublished: true } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    return res.status(200).json({
      totalPosts,
      totalUsers,
      categories: categoryCounts,
      topTags: tagCounts
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default searchRouter;