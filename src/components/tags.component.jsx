import { useContext } from "react";
import { EditorContext } from "../pages/editor.pages";

const Tag = ({ tag, tagIndex }) => {
  const {
    blog,
    blog: { tags },
    setBlog,
  } = useContext(EditorContext);

  const addEditable = (e) => {
    e.target.setAttribute("contentEditable", true);
    e.target.focus();
  };

  // FIX: was `e.keyCode = 13` (assignment!) — now correctly `e.keyCode === 13` 
  const handleTagEdit = (e) => {
    if (e.keyCode === 13 || e.keyCode === 188) {
      e.preventDefault();
      const currentTag = e.target.innerText.trim();
      if (currentTag) {
        const updatedTags = [...tags];
        updatedTags[tagIndex] = currentTag;
        setBlog({ ...blog, tags: updatedTags });
      }
      e.target.setAttribute("contentEditable", false);
    }
  };

  const handleTagDelete = () => {
    const updatedTags = tags.filter((t) => t !== tag);
    setBlog({ ...blog, tags: updatedTags });
  };

  return (
    <div className="relative p-2 mt-2 mr-2 px-5 rounded-full inline-flex items-center pr-8 border border-theme hover:border-purple/50 transition-all"
         style={{ backgroundColor: "var(--color-surface)" }}>
      <p
        className="outline-none text-sm font-medium text-theme"
        onKeyDown={handleTagEdit}
        onClick={addEditable}
        suppressContentEditableWarning
      >
        {tag}
      </p>
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-red transition-colors"
        onClick={handleTagDelete}
      >
        {/* FIX: was `class` — now `className` */}
        <i className="fi fi-br-x text-xs pointer-events-none"></i>
      </button>
    </div>
  );
};

export default Tag;
