import express from "express";
import { userModel } from "../Model/user.js";
import { blogModel } from "../Model/blog.js";
import { notificationModel } from "../Model/notification.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import "dotenv/config";

const userRouter = express.Router();

const verifyToken = (req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Not authenticated");

  try {
    const userData = jwt.verify(token, process.env.jwt_secretKey);
    req.userData = userData;
    next();
  } catch (error) {
    return res.status(403).json("Token is not valid");
  }
};

// Get user profile with stats
userRouter.get("/profile/:id", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .select("-password")
      .populate("followers", "username img")
      .populate("following", "username img");
    
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    
    // Get user's blog stats
    const blogStats = await blogModel.aggregate([
      { $match: { uid: user._id } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
          totalComments: { $sum: { $size: "$comments" } }
        }
      }
    ]);
    
    const stats = blogStats[0] || {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0
    };
    
    return res.status(200).json({
      user: {
        ...user.toObject(),
        followerCount: user.followers.length,
        followingCount: user.following.length
      },
      stats
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Update user profile
userRouter.put("/profile", verifyToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      bio,
      website,
      location,
      socialLinks,
      preferences
    } = req.body;
    
    const updatedUser = await userModel.findByIdAndUpdate(
      req.userData.id,
      {
        firstName,
        lastName,
        bio,
        website,
        location,
        socialLinks,
        preferences
      },
      { new: true }
    ).select("-password");
    
    return res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Follow/Unfollow a user
userRouter.post("/follow/:id", verifyToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.userData.id;
    
    if (targetUserId === currentUserId) {
      return res.status(400).json({ error: "You cannot follow yourself!" });
    }
    
    const currentUser = await userModel.findById(currentUserId);
    const targetUser = await userModel.findById(targetUserId);
    
    if (!targetUser) {
      return res.status(404).json({ error: "User not found!" });
    }
    
    const isFollowing = currentUser.following.includes(targetUserId);
    
    if (isFollowing) {
      // Unfollow
      currentUser.following.pull(targetUserId);
      targetUser.followers.pull(currentUserId);
    } else {
      // Follow
      currentUser.following.push(targetUserId);
      targetUser.followers.push(currentUserId);
      
      // Create notification
      const notification = new notificationModel({
        recipient: targetUserId,
        sender: currentUserId,
        type: "follow",
        message: `${currentUser.username} started following you`,
        link: `/profile/${currentUserId}`
      });
      await notification.save();
    }
    
    await currentUser.save();
    await targetUser.save();
    
    return res.status(200).json({
      message: isFollowing ? "Unfollowed successfully" : "Followed successfully",
      isFollowing: !isFollowing,
      followerCount: targetUser.followers.length
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user's followers
userRouter.get("/:id/followers", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("followers", "username img firstName lastName bio")
      .select("followers");
    
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    
    return res.status(200).json(user.followers);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user's following
userRouter.get("/:id/following", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("following", "username img firstName lastName bio")
      .select("following");
    
    if (!user) {
      return res.status(404).json({ error: "User not found!" });
    }
    
    return res.status(200).json(user.following);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get suggested users to follow
userRouter.get("/suggestions/follow", verifyToken, async (req, res) => {
  try {
    const currentUser = await userModel.findById(req.userData.id);
    
    // Find users not followed by current user, excluding current user
    const suggestions = await userModel
      .find({
        _id: { 
          $nin: [...currentUser.following, req.userData.id] 
        }
      })
      .select("username img firstName lastName bio totalViews totalLikes")
      .sort({ totalViews: -1, totalLikes: -1 })
      .limit(5);
    
    return res.status(200).json(suggestions);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get user's dashboard analytics
userRouter.get("/dashboard", verifyToken, async (req, res) => {
  try {
    const userId = req.userData.id;
    
    // Get user's posts with detailed analytics
    const posts = await blogModel.find({ uid: userId })
      .select("title views likes comments createdAt")
      .sort({ createdAt: -1 });
    
    // Calculate analytics
    const analytics = await blogModel.aggregate([
      { $match: { uid: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: null,
          totalPosts: { $sum: 1 },
          totalViews: { $sum: "$views" },
          totalLikes: { $sum: { $size: "$likes" } },
          totalComments: { $sum: { $size: "$comments" } },
          avgViews: { $avg: "$views" }
        }
      }
    ]);
    
    // Get recent activity (notifications received)
    const recentActivity = await notificationModel
      .find({ recipient: userId })
      .populate("sender", "username img")
      .sort({ createdAt: -1 })
      .limit(10);
    
    // Get follower growth (simplified - you can enhance this)
    const user = await userModel.findById(userId).select("followers");
    
    return res.status(200).json({
      analytics: analytics[0] || {
        totalPosts: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
        avgViews: 0
      },
      posts,
      recentActivity,
      followerCount: user.followers.length
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Change password
userRouter.put("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    const user = await userModel.findById(req.userData.id);
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect!" });
    }
    
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedNewPassword;
    await user.save();
    
    return res.status(200).json({ message: "Password changed successfully!" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Search users
userRouter.get("/search", async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Search query is required!" });
    }
    
    const users = await userModel
      .find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { firstName: { $regex: q, $options: "i" } },
          { lastName: { $regex: q, $options: "i" } }
        ]
      })
      .select("username img firstName lastName bio totalViews")
      .limit(parseInt(limit));
    
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default userRouter;