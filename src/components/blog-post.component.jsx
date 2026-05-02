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
      className="flex gap-5 items-start pb-6 mb-6 border-b border-theme group hover:opacity-90 transition-all"
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={profile_img}
            className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-purple/20"
            alt={fullname}
          />
          <span className="text-sm font-medium text-theme truncate">{fullname}</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted shrink-0">{getDay(publishedAt)}</span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-lg md:text-xl leading-tight text-theme group-hover:text-purple transition-colors mb-2 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted leading-6 line-clamp-2 mb-3 max-sm:hidden">
          {des}
        </p>

        {/* Footer: reading time + tag + likes */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted flex items-center gap-1">
            <i className="fi fi-rr-clock text-xs"></i>
            {readingTime} min
          </span>
          {tags?.[0] && (
            <span className="tag text-xs px-3 py-1">{tags[0]}</span>
          )}
          <span className="flex items-center gap-1 text-xs text-muted ml-auto group-hover:text-purple transition-colors">
            <i className="fi fi-rr-heart"></i>
            {total_likes?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Banner Thumbnail */}
      {banner && (
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg overflow-hidden border border-theme shadow-sm">
          <img
            src={banner}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            alt={title}
          />
        </div>
      )}
    </Link>
  );
};

export default BlogPostCard;
