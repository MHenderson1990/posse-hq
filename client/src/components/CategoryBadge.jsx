export default function CategoryBadge({ category }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: 'var(--ink)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 3, background: category.color, boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
      {category.name}
    </span>
  );
}
