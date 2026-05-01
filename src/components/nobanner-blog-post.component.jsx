import { getDay } from "../common/date";
import { Link } from "react-router-dom";

const MinimalBlogPost = ({ blog, index }) => {
  const {
    title,
    // FIX: was `bolg_id` — corrected to `blog_id` 
    blog_id: id,
    author: {
      personal_info: { fullname, username, profile_img },
    },
    publishedAt,
  } = blog;

  return (
    <Link to={`/blog/${id}`} className="flex gap-5 mb-7 group">
      {/* Index number */}
      <h1 className="blog-index shrink-0 select-none">
        {index < 9 ? "0" + (index + 1) : index + 1}
      </h1>

      <div className="flex-1 min-w-0">
        {/* Author row */}
        <div className="flex items-center gap-2 mb-2">
          <img
            src={profile_img}
            className="w-5 h-5 rounded-full object-cover shrink-0"
            alt={fullname}
          />
          <span className="text-xs text-muted truncate">
            {fullname}
            <Link
              to={`/user/${username}`}
              className="font-semibold text-theme ml-1 hover:text-purple"
            >
              @{username}
            </Link>
          </span>
          <span className="text-xs text-muted shrink-0">{getDay(publishedAt)}</span>
        </div>

        {/* Title */}
        <h1 className="blog-title group-hover:text-purple transition-colors line-clamp-2">
          {title}
        </h1>
      </div>
    </Link>
  );
};

export default MinimalBlogPost;
