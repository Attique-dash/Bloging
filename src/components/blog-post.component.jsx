import { getDay } from "../common/date";
import { Link } from "react-router-dom";

// NEW FEATURE: Calculate reading time from description word count
const getReadingTime = (text = "") => {
  const wordsPerMinute = 200;
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / wordsPerMinute));
  return minutes;
};

const BlogPostCard = ({ content, author }) => {
  const {
    publishedAt,
    banner,
    tags,
    des,
    title,
    activity: { total_likes },
    blog_id: id,
  } = content;

  const { fullname, profile_img, username } = author;
  const readingTime = getReadingTime(des);

  return (
    <Link
      to={`/blog/${id}`}
      className="flex gap-6 items-start pb-6 mb-6 border-b border-theme group"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author */}
        <div className="flex items-center gap-2 mb-3">
          <img
            src={profile_img}
            className="w-7 h-7 rounded-full object-cover shrink-0"
            alt={fullname}
          />
          <span className="text-sm font-medium text-theme truncate">{fullname}</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted shrink-0">{getDay(publishedAt)}</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted shrink-0">{readingTime} min read</span>
        </div>

        {/* Title */}
        <h3 className="blog-title group-hover:text-purple transition-colors mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted leading-6 line-clamp-2 max-sm:hidden md:max-[1100px]:hidden">
          {des}
        </p>

        {/* Footer: tag + likes */}
        <div className="flex items-center gap-4 mt-4">
          {tags?.[0] && (
            <span className="tag text-xs">{tags[0]}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted ml-auto">
            <i className="fi fi-rr-heart"></i>
            {total_likes?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Banner Thumbnail */}
      {banner && (
        <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-xl overflow-hidden border border-theme">
          <img
            src={banner}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            alt={title}
          />
        </div>
      )}
    </Link>
  );
};

export default BlogPostCard;
