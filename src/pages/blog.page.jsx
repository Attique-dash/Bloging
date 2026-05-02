import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import AnimationWraper from "../common/page-animation";
import Loader from "../components/loader.component";
import { getFullDay } from "../common/date";
import BlogContent from "../components/blog-content.component";
import LikeButton from "../components/like-button.component";
import BlogActions from "../components/blog-actions.component";

// FIX: was `conent: []` — now correctly `content: []` 
const blogStructure = {
  title: "",
  banner: "",
  content: [],
  tags: [],
  des: "",
  author: { personal_info: {} },
  publishedAt: "",
  activity: { total_likes: 0, total_reads: 0 },
};

export const BlogContext = createContext({});

// Calculate reading time from content blocks
const getReadingTime = (blocks = []) => {
  const text = blocks
    .filter((b) => b.type === "paragraph" || b.type === "header")
    .map((b) => b.data?.text || "")
    .join(" ")
    .replace(/<[^>]+>/g, "");
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

const BlogPage = () => {
  const { blog_id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog]     = useState(blogStructure);
  const [loading, setLoading] = useState(true);

  const {
    title,
    banner,
    content,
    author: {
      personal_info: { fullname, username: author_username, profile_img },
    },
    publishedAt,
    activity,
    tags,
    des,
  } = blog;

  const fetchBlog = () => {
    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/get-blog", { blog_id })
      .then(({ data: { blog } }) => {
        setBlog(blog);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBlog();
  }, [blog_id]);

  const blocks = content?.[0]?.blocks || [];
  const readingTime = getReadingTime(blocks);

  const handleDelete = () => {
    navigate("/");
  };

  return (
    <BlogContext.Provider value={{ blog, setBlog }}>
      <AnimationWraper>
        {loading ? (
          <Loader />
        ) : (
          <article className="max-w-[900px] mx-auto py-8 px-4 lg:px-0">
            {/* Back Button */}
            <Link 
              to="/" 
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-theme transition-colors mb-6"
            >
              <i className="fi fi-rr-arrow-left"></i>
              Back to Home
            </Link>

            {/* Banner */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg">
              <img
                src={banner}
                className="w-full aspect-video object-cover"
                alt={title}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
            </div>

            {/* Content Container */}
            <div className="max-w-[800px] mx-auto">
              {/* Tags row */}
              <div className="flex flex-wrap gap-2 mt-8">
                {tags?.map((tag, i) => (
                  <Link
                    key={i}
                    to={`/search/${tag}`}
                    className="tag text-xs hover:bg-purple hover:text-white hover:border-purple transition-all"
                  >
                    {tag}
                  </Link>
                ))}
              </div>

              {/* Title */}
              <h1 className="mt-4 text-3xl md:text-5xl font-bold leading-tight text-theme">
                {title}
              </h1>

              {/* Author & meta row */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 pb-6 border-b border-theme">
                <div className="flex items-center gap-3">
                  <img
                    src={profile_img}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-purple/20"
                    alt={fullname}
                  />
                  <div>
                    <p className="font-semibold text-sm text-theme capitalize">{fullname}</p>
                    <Link
                      to={`/user/${author_username}`}
                      className="text-xs text-purple hover:underline"
                    >
                      @{author_username}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <i className="fi fi-rr-calendar"></i>
                      {getFullDay(publishedAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fi fi-rr-clock"></i>
                      {readingTime} min read
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="fi fi-rr-eye"></i>
                      {activity?.total_reads?.toLocaleString() || 0}
                    </span>
                  </div>
                  {/* Edit/Delete Actions */}
                  <BlogActions 
                    blog={blog} 
                    authorId={blog.author?._id} 
                    onDelete={handleDelete}
                  />
                </div>
              </div>

              {/* Blog Content */}
              <div className="my-10 font-gelasio blog-page-content">
                {blocks.map((block, i) => (
                  <div key={i} className="my-4 md:my-8">
                    <BlogContent block={block} />
                  </div>
                ))}
              </div>

              {/* Description */}
              {des && (
                <div className="my-8 p-6 rounded-2xl border border-theme surface bg-gradient-to-r from-purple/5 to-transparent">
                  <p className="text-xs text-purple uppercase font-semibold tracking-wide mb-3 flex items-center gap-2">
                    <i className="fi fi-rr-info-circle"></i>
                    About this post
                  </p>
                  <p className="text-base font-gelasio leading-7 text-theme">{des}</p>
                </div>
              )}

              {/* Like & Share Section */}
              <div className="flex items-center justify-between py-8 border-t border-theme mt-8">
                <LikeButton
                  blog_id={blog_id}
                  initialLikes={activity?.total_likes || 0}
                />
                <Link
                  to={`/user/${author_username}`}
                  className="flex items-center gap-2 text-sm text-muted hover:text-theme transition-colors group"
                >
                  <span>More from</span>
                  <img src={profile_img} className="w-6 h-6 rounded-full object-cover ring-2 ring-purple/20 group-hover:ring-purple/40 transition-all" />
                  <span className="font-semibold text-theme">@{author_username}</span>
                </Link>
              </div>
            </div>
          </article>
        )}
      </AnimationWraper>
    </BlogContext.Provider>
  );
};

export default BlogPage;
