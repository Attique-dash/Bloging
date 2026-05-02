import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import multer from "multer";
import { GridFSBucket } from "mongodb";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// ─── MongoDB Connection & GridFS ─────────────────────────────────────────────
let gfsBucket;

// Support both MONGODB_URI and MONGODB_URL for flexibility
const mongoUrl = process.env.MONGODB_URI || process.env.MONGODB_URL;

if (!mongoUrl) {
  console.error("❌ ERROR: MONGODB_URI or MONGODB_URL environment variable is required!");
  console.error("   Please add your MongoDB connection string to the .env file");
  console.error("   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/blog_db");
  process.exit(1);
}

mongoose
  .connect(mongoUrl, { autoIndex: true })
  .then(() => {
    console.log("✅ MongoDB connected");
    // Initialize GridFS bucket for file storage
    gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: "uploads" });
    console.log("✅ GridFS initialized");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  });

// ─── Multer Config (memory storage for GridFS) ───────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, WebP, and GIF images are allowed"), false);
    }
  },
});

// ─── SCHEMAS & MODELS ────────────────────────────────────────────────────────

const userSchema = mongoose.Schema(
  {
    personal_info: {
      fullname: { type: String, lowercase: true, required: true, minlength: [3, "Fullname must be 3+ letters"] },
      email: { type: String, required: true, lowercase: true, unique: true },
      password: String,
      username: { type: String, minlength: [3, "Username must be 3+ letters"], unique: true },
      bio: { type: String, maxlength: [200, "Bio max 200 chars"], default: "" },
      profile_img: {
        type: String,
        default: () => `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.random()}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
      },
    },
    social_links: {
      youtube:   { type: String, default: "" },
      instagram: { type: String, default: "" },
      facebook:  { type: String, default: "" },
      twitter:   { type: String, default: "" },
      github:    { type: String, default: "" },
      website:   { type: String, default: "" },
    },
    account_info: {
      total_posts: { type: Number, default: 0 },
      total_reads: { type: Number, default: 0 },
    },
    google_auth: { type: Boolean, default: false },
    blogs: { type: [mongoose.Schema.Types.ObjectId], ref: "blogs", default: [] },
  },
  { timestamps: { createdAt: "joinedAt" } }
);

const blogSchema = mongoose.Schema(
  {
    blog_id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    banner: { type: String, default: "" },
    des: { type: String, maxlength: [200, "Description max 200 chars"], default: "" },
    content: { type: Array, default: [] },
    tags: { type: [String], default: [] },
    author: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    activity: {
      total_likes:           { type: Number, default: 0 },
      total_comments:        { type: Number, default: 0 },
      total_reads:           { type: Number, default: 0 },
      total_parent_comments: { type: Number, default: 0 },
    },
    comments: { type: [mongoose.Schema.Types.ObjectId], ref: "comments", default: [] },
    draft: { type: Boolean, default: false },
    // Track who liked this post
    liked_by: { type: [mongoose.Schema.Types.ObjectId], ref: "users", default: [] },
  },
  { timestamps: { createdAt: "publishedAt" } }
);

const commentSchema = mongoose.Schema(
  {
    blog_id:      { type: mongoose.Schema.Types.ObjectId, required: true },
    blog_author:  { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    comment:      { type: String, required: true },
    children:     { type: [mongoose.Schema.Types.ObjectId], ref: "comments", default: [] },
    commented_by: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "users" },
    isReply:      { type: Boolean, default: false },
    parent:       { type: mongoose.Schema.Types.ObjectId, ref: "comments", default: null },
  },
  { timestamps: { createdAt: "commentedAt" } }
);

const User    = mongoose.model("users",    userSchema);
const Blog    = mongoose.model("blogs",    blogSchema);
const Comment = mongoose.model("comments", commentSchema);

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const formatDataToSend = (user) => {
  const access_token = jwt.sign({ id: user._id }, process.env.SECRET_ACCESS_KEY, { expiresIn: "7d" });
  return {
    access_token,
    profile_img: user.personal_info.profile_img,
    username:    user.personal_info.username,
    fullname:    user.personal_info.fullname,
  };
};

const generateUsername = async (email) => {
  let username = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
  const exists = await User.exists({ "personal_info.username": username });
  if (exists) username += nanoid(5);
  return username;
};

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No access token provided" });

  jwt.verify(token, process.env.SECRET_ACCESS_KEY, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Access token is invalid or expired" });
    req.user = decoded.id;
    next();
  });
};

const BLOG_SELECT = "blog_id title des banner activity tags publishedAt -_id";
const AUTHOR_SELECT = "personal_info.profile_img personal_info.username personal_info.fullname -_id";

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

app.post("/signup", async (req, res) => {
  try {
    const { fullname, email, password } = req.body;

    if (!fullname || fullname.length < 3)
      return res.status(400).json({ error: "Fullname must be at least 3 characters" });

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email))
      return res.status(400).json({ error: "Email is invalid" });

    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/;
    if (!passwordRegex.test(password))
      return res.status(400).json({
        error: "Password must be 6–20 characters with a number, lowercase and uppercase letter",
      });

    const hashed_password = await bcrypt.hash(password, 10);
    const username = await generateUsername(email);

    const user = new User({ personal_info: { fullname, email, password: hashed_password, username } });
    const saved = await user.save();
    return res.status(200).json(formatDataToSend(saved));
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "Email already exists" });
    return res.status(500).json({ error: err.message });
  }
});

app.post("/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ "personal_info.email": email.toLowerCase() });

    if (!user) return res.status(403).json({ error: "Email not found" });
    if (user.google_auth)
      return res.status(403).json({ error: "This account uses Google sign-in. Please continue with Google." });

    const match = await bcrypt.compare(password, user.personal_info.password);
    if (!match) return res.status(403).json({ error: "Incorrect password" });

    return res.status(200).json(formatDataToSend(user));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Note: Google Auth via Firebase removed. Re-add with different OAuth provider if needed.

// ─── BLOG ROUTES ─────────────────────────────────────────────────────────────

const MAX_LIMIT = 5;

app.post("/latest-blogs", async (req, res) => {
  try {
    const { page = 1 } = req.body;
    const blogs = await Blog.find({ draft: false })
      .populate("author", AUTHOR_SELECT)
      .sort({ publishedAt: -1 })
      .select(BLOG_SELECT)
      .skip((page - 1) * MAX_LIMIT)
      .limit(MAX_LIMIT);
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/all-latest-blogs-count", async (req, res) => {
  try {
    const totalDocs = await Blog.countDocuments({ draft: false });
    return res.status(200).json({ totalDocs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/trending-blogs", async (req, res) => {
  try {
    const blogs = await Blog.find({ draft: false })
      .populate("author", AUTHOR_SELECT)
      .sort({ "activity.total_reads": -1, "activity.total_likes": -1, publishedAt: -1 })
      .select("blog_id title publishedAt -_id")
      .limit(5);
    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/search-blog", async (req, res) => {
  try {
    const { tag, query, author, page = 1, limit = MAX_LIMIT, eliminate_blog } = req.body;

    let findQuery = { draft: false };
    if (tag)    { findQuery.tags = tag; if (eliminate_blog) findQuery.blog_id = { $ne: eliminate_blog }; }
    if (query)  findQuery.title = new RegExp(query, "i");
    if (author) findQuery.author = new mongoose.Types.ObjectId(author);

    const blogs = await Blog.find(findQuery)
      .populate("author", AUTHOR_SELECT)
      .sort({ publishedAt: -1 })
      .select(BLOG_SELECT)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.status(200).json({ blogs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/search-blog-count", async (req, res) => {
  try {
    const { tag, query, author } = req.body;
    let findQuery = { draft: false };
    if (tag)    findQuery.tags = tag;
    if (query)  findQuery.title = new RegExp(query, "i");
    if (author) findQuery.author = new mongoose.Types.ObjectId(author);

    const totalDocs = await Blog.countDocuments(findQuery);
    return res.status(200).json({ totalDocs });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/create-blog", verifyJWT, async (req, res) => {
  try {
    const authorId = req.user;
    let { title, des, banner, tags, content, draft = false, id } = req.body;

    if (!title?.length) return res.status(400).json({ error: "Blog title is required" });

    if (!draft) {
      if (!des?.length || des.length > 200)
        return res.status(400).json({ error: "Description is required (max 200 chars)" });
      if (!banner?.length)
        return res.status(400).json({ error: "Blog banner is required to publish" });
      if (!content?.blocks?.length)
        return res.status(400).json({ error: "Blog content cannot be empty" });
      if (!tags?.length || tags.length > 10)
        return res.status(400).json({ error: "Provide 1–10 tags" });
    }

    tags = (tags || []).map((t) => t.toLowerCase().trim());

    if (id) {
      // Update existing blog
      await Blog.findOneAndUpdate({ blog_id: id, author: authorId }, { title, des, banner, content, tags, draft });
      return res.status(200).json({ id });
    }

    const blog_id =
      title.replace(/[^a-zA-Z0-9]/g, " ").replace(/\s+/g, "-").trim().substring(0, 50) +
      "-" +
      nanoid(8);

    const blog = new Blog({ title, des, banner, content, tags, author: authorId, blog_id, draft });
    const saved = await blog.save();

    if (!draft) {
      await User.findByIdAndUpdate(authorId, {
        $inc:  { "account_info.total_posts": 1 },
        $push: { blogs: saved._id },
      });
    }

    return res.status(200).json({ id: saved.blog_id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/get-blog", async (req, res) => {
  try {
    const { blog_id, mode } = req.body;
    const increment = mode !== "edit" ? 1 : 0;

    const blog = await Blog.findOneAndUpdate(
      { blog_id },
      { $inc: { "activity.total_reads": increment } },
      { new: true }
    ).populate("author", "personal_info.fullname personal_info.username personal_info.profile_img");

    if (!blog) return res.status(404).json({ error: "Blog not found" });
    if (blog.draft) return res.status(403).json({ error: "This blog is a draft" });

    if (increment) {
      await User.findByIdAndUpdate(blog.author._id, { $inc: { "account_info.total_reads": 1 } });
    }

    return res.status(200).json({ blog });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Like / Unlike Blog
app.post("/like-blog", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { blog_id } = req.body;

    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    const alreadyLiked = blog.liked_by.includes(userId);

    if (alreadyLiked) {
      await Blog.findByIdAndUpdate(blog._id, {
        $pull: { liked_by: userId },
        $inc:  { "activity.total_likes": -1 },
      });
      return res.status(200).json({ liked: false, total_likes: blog.activity.total_likes - 1 });
    } else {
      await Blog.findByIdAndUpdate(blog._id, {
        $push: { liked_by: userId },
        $inc:  { "activity.total_likes": 1 },
      });
      return res.status(200).json({ liked: true, total_likes: blog.activity.total_likes + 1 });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete blog endpoint
app.post("/delete-blog", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { blog_id } = req.body;

    const blog = await Blog.findOne({ blog_id });
    if (!blog) return res.status(404).json({ error: "Blog not found" });

    // Check if user is the author
    if (blog.author.toString() !== userId) {
      return res.status(403).json({ error: "You can only delete your own blogs" });
    }

    await Blog.findOneAndDelete({ blog_id });

    // Remove blog reference from user and decrement post count
    await User.findByIdAndUpdate(userId, {
      $pull: { blogs: blog._id },
      $inc: { "account_info.total_posts": -1 },
    });

    return res.status(200).json({ message: "Blog deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Check if current user liked a blog
app.post("/is-liked", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { blog_id } = req.body;
    const blog = await Blog.findOne({ blog_id }).select("liked_by");
    const liked = blog?.liked_by?.includes(userId) || false;
    return res.status(200).json({ liked, total_likes: 0 });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── COMMENT ROUTES ──────────────────────────────────────────────────────────

app.post("/add-comment", verifyJWT, async (req, res) => {
  try {
    const userId = req.user;
    const { blog_id, blog_author, comment } = req.body;

    if (!comment?.trim()) return res.status(400).json({ error: "Comment cannot be empty" });

    const commentDoc = new Comment({ blog_id, blog_author, comment, commented_by: userId });
    const saved = await commentDoc.save();

    await Blog.findByIdAndUpdate(blog_id, {
      $push: { comments: saved._id },
      $inc:  { "activity.total_comments": 1, "activity.total_parent_comments": 1 },
    });

    const populated = await saved.populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img");

    return res.status(200).json({
      comment: populated.comment,
      commentedAt: populated.commentedAt,
      _id: populated._id,
      commented_by: populated.commented_by,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/get-blog-comments", async (req, res) => {
  try {
    const { blog_id, skip = 0 } = req.body;
    const comments = await Comment.find({ blog_id, isReply: false })
      .populate("commented_by", "personal_info.fullname personal_info.username personal_info.profile_img")
      .sort({ commentedAt: -1 })
      .skip(skip)
      .limit(5);
    return res.status(200).json({ data: comments });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── USER ROUTES ─────────────────────────────────────────────────────────────

app.post("/get-profile", async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ "personal_info.username": username })
      .select("-personal_info.password -google_auth -blogs");
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/search-users", async (req, res) => {
  try {
    const { query } = req.body;
    const users = await User.find({ "personal_info.username": new RegExp(query, "i") })
      .limit(50)
      .select("personal_info.fullname personal_info.username personal_info.profile_img -_id");
    return res.status(200).json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post("/update-profile", verifyJWT, async (req, res) => {
  try {
    const { fullname, bio, social_links } = req.body;
    if (fullname.length < 3) return res.status(400).json({ error: "Fullname must be 3+ characters" });
    if (bio.length > 200) return res.status(400).json({ error: "Bio max 200 characters" });

    await User.findByIdAndUpdate(req.user, {
      "personal_info.fullname": fullname,
      "personal_info.bio": bio,
      social_links,
    });

    return res.status(200).json({ username: req.user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── IMAGE UPLOAD ROUTES (MongoDB GridFS) ────────────────────────────────────

// Upload blog banner image
app.post("/upload-banner", verifyJWT, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const filename = `banner-${nanoid(12)}-${Date.now()}`;
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: { userId: req.user, type: "banner" },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      // Return the file URL (you can create a serving endpoint)
      const fileId = uploadStream.id.toString();
      return res.status(200).json({
        success: 1,
        file: { url: `${process.env.SERVER_URL || ""}/image/${fileId}` },
        fileId,
      });
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      return res.status(500).json({ error: "Failed to upload image" });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload blog content image (for EditorJS)
app.post("/upload-image", verifyJWT, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });

    const filename = `blog-${nanoid(12)}-${Date.now()}`;
    const uploadStream = gfsBucket.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: { userId: req.user, type: "blog-image" },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      const fileId = uploadStream.id.toString();
      return res.status(200).json({
        success: 1,
        file: { url: `${process.env.SERVER_URL || ""}/image/${fileId}` },
      });
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      return res.status(500).json({ success: 0, error: "Failed to upload image" });
    });
  } catch (err) {
    return res.status(500).json({ success: 0, error: err.message });
  }
});

// Serve images from GridFS
app.get("/image/:id", async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const downloadStream = gfsBucket.openDownloadStream(fileId);

    downloadStream.on("error", (err) => {
      console.error("GridFS download error:", err);
      return res.status(404).json({ error: "Image not found" });
    });

    downloadStream.pipe(res);
  } catch (err) {
    return res.status(400).json({ error: "Invalid image ID" });
  }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── START ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
