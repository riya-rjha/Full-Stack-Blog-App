// "id", "title", "desc", "img", "cat", "date", and "uid"

import mongoose from "mongoose";

const { Schema } = mongoose;

const commentSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxLength: 1000,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const blogSchema = new Schema(
  {
    title: {
      required: true,
      type: String,
    },
    desc: {
      required: true,
      type: String,
      maxLength: 7000,
    },
    cat: {
      required: true,
      type: String,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    img: {
      type: String,
    },
    uid: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
      index: true,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
    }],
    comments: [commentSchema],
    views: {
      type: Number,
      default: 0,
    },
    readingTime: {
      type: Number, // in minutes
      default: 1,
    },
    isPinned: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    featuredImage: {
      type: String,
    },
    excerpt: {
      type: String,
      maxLength: 200,
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better performance
blogSchema.index({ title: "text", desc: "text", tags: "text" });
blogSchema.index({ cat: 1, createdAt: -1 });
blogSchema.index({ uid: 1, createdAt: -1 });
blogSchema.index({ views: -1 });

export const blogModel = mongoose.model("blogs", blogSchema);
