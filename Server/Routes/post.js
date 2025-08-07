import express from "express";
import { blogModel } from "../Model/blog.js";
import { userModel } from "../Model/user.js";
import { notificationModel } from "../Model/notification.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const app = express();

const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  console.log(token);
  if (!token) return res.status(401).json("Not authenticated");

  try {
    const userData = jwt.verify(token, process.env.jwt_secretKey);
    req.userData = userData;
    next();
  } catch (error) {
    return res.status(403).json("Token is not valid");
  }
};

// Helper function to calculate reading time
const calculateReadingTime = (text) => {
  const wordsPerMinute = 200; // Average reading speed
  const words = text.split(' ').length;
  return Math.ceil(words / wordsPerMinute);
};

const postRouter = express.Router();

// Post a blog
postRouter.post("/", async (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const userData = jwt.verify(token, process.env.jwt_secretKey);
    const readingTime = calculateReadingTime(req.body.desc);
    
    const newBlog = new blogModel({
      ...req.body,
      uid: userData.id,
      readingTime,
      excerpt: req.body.desc.substring(0, 200),
    });
    await newBlog.save();
    
    // Update user's total posts count (for analytics)
    await userModel.findByIdAndUpdate(userData.id, {
      $inc: { totalPosts: 1 }
    });
    
    return res.status(201).json({ message: "Blog created successfully!", data: newBlog });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

// Get all blogs with advanced filtering and sorting
postRouter.get("/", async (req, res) => {
  try {
    const { 
      cat, 
      search, 
      tags, 
      sortBy = "createdAt", 
      order = "desc", 
      page = 1, 
      limit = 10,
      author 
    } = req.query;
    
    let query = { isPublished: true };
    
    // Category filter
    if (cat) query.cat = cat;
    
    // Author filter
    if (author) query.uid = author;
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { desc: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } }
      ];
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(",");
      query.tags = { $in: tagArray };
    }
    
    const sortOrder = order === "desc" ? -1 : 1;
    const skip = (page - 1) * limit;
    
    const blogs = await blogModel
      .find(query)
      .populate("uid", "username img firstName lastName")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await blogModel.countDocuments(query);
    
    return res.status(200).json({
      blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalBlogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get trending posts (most viewed/liked in last 7 days)
postRouter.get("/trending", async (req, res) => {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const trendingPosts = await blogModel.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          isPublished: true
        }
      },
      {
        $addFields: {
          likesCount: { $size: "$likes" },
          totalEngagement: { $add: ["$views", { $size: "$likes" }, { $size: "$comments" }] }
        }
      },
      {
        $sort: { totalEngagement: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    await blogModel.populate(trendingPosts, { path: "uid", select: "username img" });
    
    return res.status(200).json(trendingPosts);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get single blog with view increment
postRouter.get("/:id", async (req, res) => {
  try {
    const blog = await blogModel
      .findByIdAndUpdate(
        req.params.id,
        { $inc: { views: 1 } },
        { new: true }
      )
      .populate("uid", "username img firstName lastName bio")
      .populate("comments.userId", "username img");
    
    if (!blog) {
      return res.status(404).json({ error: "Post not found!" });
    }
    
    // Update author's total views
    await userModel.findByIdAndUpdate(blog.uid._id, {
      $inc: { totalViews: 1 }
    });
    
    return res.status(200).json(blog);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Like/Unlike a blog post
postRouter.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const blog = await blogModel.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Post not found!" });
    }
    
    const userId = req.userData.id;
    const isLiked = blog.likes.includes(userId);
    
    if (isLiked) {
      // Unlike
      blog.likes.pull(userId);
      await userModel.findByIdAndUpdate(blog.uid, { $inc: { totalLikes: -1 } });
    } else {
      // Like
      blog.likes.push(userId);
      await userModel.findByIdAndUpdate(blog.uid, { $inc: { totalLikes: 1 } });
      
      // Create notification if not own post
      if (blog.uid.toString() !== userId) {
        const liker = await userModel.findById(userId);
        const notification = new notificationModel({
          recipient: blog.uid,
          sender: userId,
          type: "like",
          message: `${liker.username} liked your post "${blog.title}"`,
          relatedPost: blog._id,
          link: `/blog/${blog._id}`
        });
        await notification.save();
      }
    }
    
    await blog.save();
    
    return res.status(200).json({ 
      message: isLiked ? "Post unliked" : "Post liked",
      likesCount: blog.likes.length,
      isLiked: !isLiked
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Add comment to a blog post
postRouter.post("/:id/comment", verifyToken, async (req, res) => {
  try {
    const { content } = req.body;
    const blog = await blogModel.findById(req.params.id);
    const user = await userModel.findById(req.userData.id);
    
    if (!blog) {
      return res.status(404).json({ error: "Post not found!" });
    }
    
    const newComment = {
      userId: req.userData.id,
      username: user.username,
      content,
      createdAt: new Date()
    };
    
    blog.comments.push(newComment);
    await blog.save();
    
    // Create notification if not own post
    if (blog.uid.toString() !== req.userData.id) {
      const notification = new notificationModel({
        recipient: blog.uid,
        sender: req.userData.id,
        type: "comment",
        message: `${user.username} commented on your post "${blog.title}"`,
        relatedPost: blog._id,
        link: `/blog/${blog._id}`
      });
      await notification.save();
    }
    
    return res.status(201).json({ 
      message: "Comment added successfully",
      comment: newComment
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Bookmark/Unbookmark a post
postRouter.post("/:id/bookmark", verifyToken, async (req, res) => {
  try {
    const user = await userModel.findById(req.userData.id);
    const postId = req.params.id;
    
    const isBookmarked = user.bookmarks.includes(postId);
    
    if (isBookmarked) {
      user.bookmarks.pull(postId);
    } else {
      user.bookmarks.push(postId);
    }
    
    await user.save();
    
    return res.status(200).json({
      message: isBookmarked ? "Bookmark removed" : "Post bookmarked",
      isBookmarked: !isBookmarked
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user's bookmarked posts
postRouter.get("/user/bookmarks", verifyToken, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.userData.id)
      .populate({
        path: "bookmarks",
        populate: { path: "uid", select: "username img" }
      });
    
    return res.status(200).json(user.bookmarks);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete a blog
postRouter.delete("/:id", verifyToken, async (req, res) => {
  try {
    const deletedPost = await blogModel.findOneAndDelete({
      _id: req.params.id,
      uid: req.userData.id,
    });
    if (!deletedPost) {
      return res.status(404).json({ error: "You can delete only your post!" });
    }
    return res.status(200).json({ message: "Post successfully deleted!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update a blog
postRouter.put("/:id", verifyToken, async (req, res) => {
  try {
    // Recalculate reading time if description changed
    if (req.body.desc) {
      req.body.readingTime = calculateReadingTime(req.body.desc);
      req.body.excerpt = req.body.desc.substring(0, 200);
    }
    
    const updatedPost = await blogModel.findOneAndUpdate(
      { _id: req.params.id, uid: req.userData.id },
      req.body,
      { new: true }
    );
    if (!updatedPost) {
      return res.status(404).json({ error: "You can update only your post!" });
    }
    return res
      .status(200)
      .json({ message: "Post successfully updated!", data: updatedPost });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default postRouter;
