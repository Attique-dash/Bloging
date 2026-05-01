import { useContext, useEffect, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";

const LikeButton = ({ blog_id, initialLikes = 0 }) => {
  const { userAuth: { access_token } } = useContext(UserContext);
  const [liked, setLiked]       = useState(false);
  const [likes, setLikes]       = useState(initialLikes);
  const [loading, setLoading]   = useState(false);
  const [checked, setChecked]   = useState(false);

  // Check if current user has liked this blog
  useEffect(() => {
    if (!access_token || !blog_id) { setChecked(true); return; }
    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/is-liked",
        { blog_id },
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      .then(({ data }) => {
        setLiked(data.liked);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [blog_id, access_token]);

  const handleLike = () => {
    if (!access_token) {
      // Redirect to sign-in or show a toast
      return;
    }
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes((l) => l + (newLiked ? 1 : -1));

    axios
      .post(
        import.meta.env.VITE_SERVER_DOMAIN + "/like-blog",
        { blog_id },
        { headers: { Authorization: `Bearer ${access_token}` } }
      )
      .then(({ data }) => {
        setLiked(data.liked);
        setLikes(data.total_likes);
      })
      .catch(() => {
        // Revert on error
        setLiked(!newLiked);
        setLikes((l) => l + (newLiked ? -1 : 1));
      })
      .finally(() => setLoading(false));
  };

  if (!checked) return null;

  return (
    <button
      onClick={handleLike}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold border transition-all ${
        liked
          ? "bg-red/10 border-red text-red"
          : "border-theme text-muted hover:border-red hover:text-red"
      }`}
      title={access_token ? (liked ? "Unlike" : "Like this blog") : "Sign in to like"}
    >
      <i className={`fi ${liked ? "fi-sr-heart" : "fi-rr-heart"} text-sm`}></i>
      <span>{likes?.toLocaleString()}</span>
    </button>
  );
};

export default LikeButton;
