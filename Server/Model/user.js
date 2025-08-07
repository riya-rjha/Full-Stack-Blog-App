// "id", "username", "email", "password", and "img"
// Mongoose provides it's set of _id field - primary key
import mongoose, { Model } from "mongoose";

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    img: {
      type: String,
    },
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    bio: {
      type: String,
      maxLength: 500,
    },
    website: {
      type: String,
    },
    location: {
      type: String,
    },
    socialLinks: {
      twitter: String,
      linkedin: String,
      github: String,
      instagram: String,
    },
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    }],
    bookmarks: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "blogs",
    }],
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "light",
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      newsletterSubscription: {
        type: Boolean,
        default: false,
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin", "moderator"],
      default: "user",
    },
    lastLogin: {
      type: Date,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    badges: [{
      name: String,
      description: String,
      earnedAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },

  {
    timestamps: true, // Creates createdAt + updatedAt fields
  }
);

// Add indexes for better performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ totalViews: -1 });
userSchema.index({ createdAt: -1 });

export const userModel = mongoose.model("users", userSchema);