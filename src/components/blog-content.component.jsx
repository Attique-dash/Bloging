// FIX: Removed leading spaces from type strings " image", " quote", " list"

const Img = ({ url, caption }) => (
  <div className="my-6">
    <img src={url} alt={caption || "Blog image"} className="rounded-xl w-full object-cover" />
    {caption?.length > 0 && (
      <p className="w-full text-center mt-3 text-sm text-muted font-gelasio">
        {caption}
      </p>
    )}
  </div>
);

const Quote = ({ quote, caption }) => (
  <div className="my-6 rounded-xl p-5 pl-6 border-l-4 border-purple" style={{ backgroundColor: "rgba(139,70,255,0.06)" }}>
    <p className="text-xl leading-9 md:text-2xl font-gelasio italic">{quote}</p>
    {caption?.length > 0 && (
      <p className="mt-2 text-sm text-muted">{caption}</p>
    )}
  </div>
);

const List = ({ style, items }) => (
  <ol className={`pl-6 my-4 space-y-2 ${style === "ordered" ? "list-decimal" : "list-disc"}`}>
    {items.map((item, i) => (
      <li
        key={i}
        className="text-xl font-gelasio leading-8"
        dangerouslySetInnerHTML={{ __html: item }}
      />
    ))}
  </ol>
);

const BlogContent = ({ block }) => {
  const { type, data } = block;

  if (type === "paragraph") {
    return <p dangerouslySetInnerHTML={{ __html: data.text }} />;
  }

  if (type === "header") {
    return data.level === 3 ? (
      <h3 className="text-3xl font-bold" dangerouslySetInnerHTML={{ __html: data.text }} />
    ) : (
      <h2 className="text-4xl font-bold" dangerouslySetInnerHTML={{ __html: data.text }} />
    );
  }

  // FIX: was " image" (with leading space) — now correctly "image"
  if (type === "image") {
    return <Img url={data.file?.url} caption={data.caption} />;
  }

  // FIX: was " quote" — now "quote"
  if (type === "quote") {
    return <Quote quote={data.text} caption={data.caption} />;
  }

  // FIX: was " list" — now "list"
  if (type === "list") {
    return <List style={data.style} items={data.items} />;
  }

  return null;
};

export default BlogContent;
