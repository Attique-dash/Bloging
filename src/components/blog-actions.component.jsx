import { useContext, useState } from "react";
import { UserContext } from "../App";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const BlogActions = ({ blog, authorId, onDelete }) => {
  const { userAuth } = useContext(UserContext);
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = userAuth?.access_token && userAuth?.id === authorId;

  if (!isAuthor) return null;

  const handleEdit = () => {
    navigate("/editor", { state: { blog, editMode: true } });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const loadingToast = toast.loading("Deleting blog...");

    try {
      await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + "/delete-blog",
        { blog_id: blog.blog_id },
        { headers: { Authorization: `Bearer ${userAuth.access_token}` } }
      );

      toast.dismiss(loadingToast);
      toast.success("Blog deleted successfully");
      
      if (onDelete) {
        onDelete();
      } else {
        navigate("/");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.response?.data?.error || "Failed to delete blog");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={handleEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-purple hover:bg-purple/10 rounded-full transition-all"
        >
          <i className="fi fi-rr-pencil"></i>
          Edit
        </button>
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red hover:bg-red/10 rounded-full transition-all"
        >
          <i className="fi fi-rr-trash"></i>
          Delete
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-d-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fi fi-rr-trash text-red text-xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-center mb-2 text-theme">
              Delete Blog?
            </h3>
            <p className="text-muted text-center text-sm mb-6">
              This action cannot be undone. This will permanently delete your blog.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium border border-theme hover:bg-surface transition-all disabled:opacity-50 text-theme"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-full text-sm font-medium bg-red text-white hover:bg-red/90 transition-all disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BlogActions;
