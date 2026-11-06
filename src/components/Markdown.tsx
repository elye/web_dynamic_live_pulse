import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";

const components = {
  a: ({
    node: _node,
    ...props
  }: React.ComponentProps<"a"> & { node?: unknown }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
};

/** Renders user-supplied Markdown. Raw HTML is not rendered. */
export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
