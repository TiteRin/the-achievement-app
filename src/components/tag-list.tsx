export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-cozy-sage-soft px-2 py-0.5 text-xs font-medium text-cozy-sage"
        >
          #{tag}
        </span>
      ))}
    </div>
  );
}
