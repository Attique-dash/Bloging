import Embed from "@editorjs/embed";
import List from "@editorjs/list";
import Image from "@editorjs/image";
import Header from "@editorjs/header";
import Quote from "@editorjs/quote";
import Marker from "@editorjs/marker";
import InLineCode from "@editorjs/inline-code";
import axios from "axios";

// Get auth token from session storage
const getToken = () => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  return user?.access_token;
};

// Upload image to server (MongoDB GridFS)
const uploadImageByFile = (file) => {
  const formData = new FormData();
  formData.append("image", file);

  return axios
    .post(import.meta.env.VITE_SERVER_DOMAIN + "/upload-image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: `Bearer ${getToken()}`,
      },
    })
    .then(({ data }) => data)
    .catch((error) => {
      console.error("Image upload error:", error);
      return { success: 0, error: "Failed to upload image" };
    });
};

// Upload image by URL (just returns the URL for EditorJS)
const uploadImageByUrl = (url) => {
  return Promise.resolve({
    success: 1,
    file: { url },
  });
};

export const tools = {
  embed: Embed,
  list: {
    class: List,
    inlineToolbar: true,
  },
  image: {
    class: Image,
    config: {
      uploader: {
        uploadByUrl:  uploadImageByUrl,
        uploadByFile: uploadImageByFile,
      },
    },
  },
  header: {
    class: Header,
    config: {
      placeholder:   "Type a heading…",
      levels:        [2, 3],
      defaultLevel:  2,
    },
  },
  quote: {
    class:         Quote,
    inlineToolbar: true,
  },
  marker:     Marker,
  inlineCode: InLineCode,
};
