import { Link, useLocation } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWraper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import { useContext, useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { EditorContext } from "../pages/editor.pages";
import EditorJS from "@editorjs/editorjs";
import { tools } from "./tools.component";

// Get auth token from session storage
const getToken = () => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  return user?.access_token;
};

const BlogEditor = () => {
  const location = useLocation();
  const editMode = location.state?.editMode || false;
  const editBlog = location.state?.blog || null;

  const {
    blog,
    blog: { title, banner, content },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  // Load blog data for editing
  useEffect(() => {
    if (editMode && editBlog) {
      setBlog(editBlog);
    }
  }, [editMode, editBlog, setBlog]);

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId:    "textEditor",
          data:        editMode && editBlog ? editBlog.content : content,
          tools:       tools,
          placeholder: "Tell your story…",
        })
      );
    }
  }, []);

  const handleBannerUpload = (e) => {
    const img = e.target.files[0];
    if (!img) return;

    const loadingToast = toast.loading("Uploading banner…");
    const formData = new FormData();
    formData.append("image", img);

    axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + "/upload-banner", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${getToken()}`,
        },
      })
      .then(({ data }) => {
        toast.dismiss(loadingToast);
        toast.success("Banner uploaded ✓");
        setBlog({ ...blog, banner: data.file.url });
      })
      .catch((err) => {
        toast.dismiss(loadingToast);
        toast.error("Upload failed: " + (err.response?.data?.error || err.message));
      });
  };

  const handleTitleKeyDown = (e) => {
    if (e.keyCode === 13) e.preventDefault();
  };

  const handleTitleChange = (e) => {
    const input = e.target;
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
    setBlog({ ...blog, title: input.value });
  };

  const handlePublish = () => {
    if (!banner?.length) return toast.error("Upload a banner to publish");
    if (!title?.length)  return toast.error("Add a title to publish");

    if (textEditor.isReady) {
      textEditor
        .save()
        .then((data) => {
          if (data.blocks.length) {
            // If editing, include the blog id
            if (editMode && editBlog) {
              setBlog({ ...blog, content: data, id: editBlog.blog_id });
            } else {
              setBlog({ ...blog, content: data });
            }
            setEditorState("Publish");
          } else {
            toast.error("Write some content before publishing");
          }
        })
        .catch(console.error);
    }
  };

  return (
    <>
      <nav className="navbar border-b border-theme">
        <Link to="/" className="flex-none w-10 h-10 hover:opacity-80 transition-opacity">
          <img src={logo} className="w-full object-contain" alt="Logo" />
        </Link>
        <div className="flex items-center gap-2 flex-1 px-4">
          <span className="text-xs text-muted uppercase tracking-wide font-medium hidden md:block">
            {editMode ? "Editing" : "New Blog"}
          </span>
          <p className="text-muted text-sm line-clamp-1 flex-1">
            {title?.length ? <span className="font-semibold text-theme">{title}</span> : "Untitled"}
          </p>
        </div>
        <div className="flex gap-3 ml-auto items-center">
          <Link to="/" className="text-sm text-muted hover:text-theme transition-colors px-3 py-2">
            Cancel
          </Link>
          <button 
            className="btn-dark py-2 px-6 text-sm flex items-center gap-2 hover:scale-105 transition-transform" 
            onClick={handlePublish}
          >
            <i className="fi fi-rr-check"></i>
            {editMode ? "Update" : "Publish"}
          </button>
        </div>
      </nav>

      <Toaster position="top-right" />

      <AnimationWraper>
        <section className="py-8">
          <div className="mx-auto max-w-[900px] w-full">
            {/* Banner Upload */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-dashed border-theme hover:border-purple/50 transition-colors cursor-pointer group">
              <label htmlFor="uploadBanner" className="cursor-pointer block w-full h-full">
                <img
                  src={banner || defaultBanner}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = defaultBanner; }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-sm font-semibold flex items-center gap-2">
                    <i className="fi fi-rr-picture"></i>
                    Change Banner
                  </span>
                </div>
                <input
                  id="uploadBanner"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp"
                  hidden
                  onChange={handleBannerUpload}
                />
              </label>
            </div>

            {/* Title */}
            <textarea
              defaultValue={title}
              placeholder="Blog Title…"
              className="text-4xl font-bold w-full h-20 outline-none resize-none mt-8 leading-tight bg-transparent text-theme placeholder:text-muted/40 border-none"
              onKeyDown={handleTitleKeyDown}
              onChange={handleTitleChange}
            ></textarea>

            <hr className="w-full opacity-10 my-5 border-theme" />

            {/* EditorJS content area */}
            <div id="textEditor" className="font-gelasio min-h-[200px]"></div>
          </div>
        </section>
      </AnimationWraper>
    </>
  );
};

export default BlogEditor;
