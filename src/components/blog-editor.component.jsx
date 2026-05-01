import { Link } from "react-router-dom";
import logo from "../imgs/logo.png";
import AnimationWraper from "../common/page-animation";
import defaultBanner from "../imgs/blog banner.png";
import axios from "axios";
import { useContext, useEffect } from "react";
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
  const {
    blog,
    blog: { title, banner, content },
    setBlog,
    textEditor,
    setTextEditor,
    setEditorState,
  } = useContext(EditorContext);

  useEffect(() => {
    if (!textEditor.isReady) {
      setTextEditor(
        new EditorJS({
          holderId:    "textEditor",
          data:        content,
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
            setBlog({ ...blog, content: data });
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
      <nav className="navbar">
        <Link to="/" className="flex-none w-10 h-10">
          <img src={logo} className="w-full object-contain" />
        </Link>
        <p className="max-md:hidden text-muted text-sm line-clamp-1 flex-1 px-4">
          {title?.length ? <span className="font-semibold text-theme">{title}</span> : "New Blog"}
        </p>
        <div className="flex gap-3 ml-auto">
          <button className="btn-light py-2 px-5 text-sm" onClick={handlePublish}>
            Publish
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
