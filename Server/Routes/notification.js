import express from "express";
import { notificationModel } from "../Model/notification.js";
import jwt from "jsonwebtoken";
import "dotenv/config";

const notificationRouter = express.Router();

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

// Get user's notifications
notificationRouter.get("/", verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;
    
    let query = { recipient: req.userData.id };
    if (unreadOnly === "true") {
      query.isRead = false;
    }
    
    const notifications = await notificationModel
      .find(query)
      .populate("sender", "username img firstName lastName")
      .populate("relatedPost", "title")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await notificationModel.countDocuments(query);
    const unreadCount = await notificationModel.countDocuments({
      recipient: req.userData.id,
      isRead: false
    });
    
    return res.status(200).json({
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalNotifications: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      unreadCount
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
notificationRouter.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userData.id },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found!" });
    }
    
    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
notificationRouter.put("/read-all", verifyToken, async (req, res) => {
  try {
    await notificationModel.updateMany(
      { recipient: req.userData.id, isRead: false },
      { isRead: true }
    );
    
    return res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Delete notification
notificationRouter.delete("/:id", verifyToken, async (req, res) => {
  try {
    const notification = await notificationModel.findOneAndDelete({
      _id: req.params.id,
      recipient: req.userData.id
    });
    
    if (!notification) {
      return res.status(404).json({ error: "Notification not found!" });
    }
    
    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Get unread notification count
notificationRouter.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await notificationModel.countDocuments({
      recipient: req.userData.id,
      isRead: false
    });
    
    return res.status(200).json({ unreadCount: count });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

export default notificationRouter;