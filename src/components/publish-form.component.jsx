import { Toaster, toast } from "react-hot-toast";
import AnimationWraper from "../common/page-animation";
import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";
import Tag from "./tags.component";
import axios from "axios";
import { UserContext } from "../App";
import { useNavigate } from "react-router-dom";

const PublishForm = () => {
  const characterLimit = 200;
  const tagLimit = 10;

  const {
    blog,
    blog: { title, banner, tags, des, content },
    setEditorState,
    setBlog,
  } = useContext(EditorContext);

  const {
    userAuth: { access_token },
  } = useContext(UserContext);

  const Navigate = useNavigate();

  const handleKeyDown = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      const tag = e.target.value.trim().toLowerCase();
      if (!tag) return;
      if (tags.length >= tagLimit) return toast.error(`Maximum ${tagLimit} tags allowed`);
      if (tags.includes(tag)) return toast.error("Tag already added");
      setBlog({ ...blog, tags: [...tags, tag] });
      e.target.value = "";
    }
  };

  const isEditMode = blog?.id ? true : false;

  const publishBlog = (e) => {
    e.preventDefault();
    if (!banner?.length) return toast.error("Upload a blog banner first");
    if (!title?.length) return toast.error("Add a blog title first");
    if (!des?.length || des.length > characterLimit)
      return toast.error(`Description required (max ${characterLimit} chars)`);
    if (!tags?.length) return toast.error("Add at least one tag");

    const loadingToast = toast.loading(isEditMode ? "Updating blog…" : "Publishing…");

    const blogObj = { title, banner, tags, des, content, draft: false, id: blog?.id };

    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/create-blog", blogObj, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      .then(() => {
        toast.dismiss(loadingToast);
        toast.success(isEditMode ? "Blog updated! ✨" : "Blog published! 🚀");
        setTimeout(() => Navigate("/"), 500);
      })
      .catch(({ response }) => {
        toast.dismiss(loadingToast);
        toast.error(response?.data?.error || "Failed to publish");
      });
  };

  return (
    <AnimationWraper>
      <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-12 lg:gap-8 bg-gradient-to-br from-purple/5 via-transparent to-transparent">
        <Toaster position="top-right" />

        {/* Close button */}
        <button
          type="button"
          className="w-10 h-10 absolute right-[5vw] top-[5%] lg:top-[10%] rounded-full flex items-center justify-center border border-theme hover:bg-surface transition-all z-10 shadow-sm"
          onClick={() => setEditorState("editor")}
        >
          <i className="fi fi-br-x text-sm text-muted"></i>
        </button>

        {/* Left: Preview */}
        <div className="max-w-[550px] mx-auto px-6 w-full">
          <div className="flex items-center gap-2 mb-4">
            <i className="fi fi-rr-eye text-muted text-sm"></i>
            <p className="text-muted text-sm font-medium uppercase tracking-wide">
              Preview
            </p>
          </div>
          <div className="w-full aspect-video rounded-2xl overflow-hidden border border-theme shadow-lg">
            <img src={banner} alt="Blog banner" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mt-5 leading-tight line-clamp-2 text-theme">
            {title || "Your Blog Title"}
          </h1>
          <p className="font-gelasio line-clamp-2 leading-7 text-base mt-3 text-muted">
            {des || "Your description will appear here…"}
          </p>
          <div className="flex items-center gap-2 mt-4 text-xs text-muted">
            <i className="fi fi-rr-tag"></i>
            <span>{tags.length > 0 ? tags.join(", ") : "No tags yet"}</span>
          </div>
        </div>

        {/* Right: Form */}
        <div className="lg:pl-8 px-6 mt-8 lg:mt-0 max-w-[500px] w-full">
          <h2 className="text-xl font-bold text-theme mb-6 flex items-center gap-2">
            <i className="fi fi-rr-settings text-purple"></i>
            {isEditMode ? "Update Blog" : "Publish Settings"}
          </h2>

          {/* Blog Title */}
          <label className="block text-sm font-medium text-muted mb-2">
            Blog Title
          </label>
          <input
            type="text"
            placeholder="Enter an engaging title..."
            defaultValue={title}
            className="input-box"
            onChange={(e) => setBlog({ ...blog, title: e.target.value })}
          />

          {/* Description */}
          <label className="block text-sm font-medium text-muted mb-2 mt-5">
            Short Description
          </label>
          <textarea
            maxLength={characterLimit}
            defaultValue={des}
            className="h-32 resize-none leading-7 input-box"
            placeholder="Write a short, engaging description that appears in search results..."
            onChange={(e) => setBlog({ ...blog, des: e.target.value })}
            onKeyDown={(e) => e.keyCode === 13 && e.preventDefault()}
          ></textarea>
          <div className="flex justify-between mt-1">
            <p className="text-xs text-muted">
              Max {characterLimit} characters
            </p>
            <p className={`text-xs ${(des?.length || 0) > characterLimit * 0.8 ? 'text-red' : 'text-muted'}`}>
              {characterLimit - (des?.length || 0)} left
            </p>
          </div>

          {/* Tags */}
          <label className="block text-sm font-medium text-muted mb-2 mt-5">
            Topics / Tags
          </label>
          <div className="input-box py-3 min-h-[60px]">
            <input
              type="text"
              placeholder="Press Enter or comma to add tag…"
              className="w-full outline-none bg-transparent text-sm text-theme placeholder:text-muted mb-2"
              onKeyDown={handleKeyDown}
            />
            {tags.map((tag, i) => (
              <Tag tag={tag} tagIndex={i} key={i} />
            ))}
          </div>
          <p className="text-right text-xs text-muted mt-1 mb-8">
            {tagLimit - tags.length} tags remaining
          </p>

          {/* Publish Button */}
          <button
            type="button"
            className="btn-dark px-8 w-full md:w-auto flex items-center justify-center gap-2 hover:scale-105 transition-transform"
            onClick={publishBlog}
          >
            <i className={`fi ${isEditMode ? 'fi-rr-refresh' : 'fi-rr-paper-plane'}`}></i>
            {isEditMode ? "Update Blog" : "Publish Blog"}
          </button>
        </div>
      </section>
    </AnimationWraper>
  );
};

export default PublishForm;
