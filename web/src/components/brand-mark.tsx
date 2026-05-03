export function BrandMark({
  label = "ClapatusTime",
  caption,
}: {
  label?: string;
  caption?: string;
}) {
  return (
    <div className="brand-lockup">
      <div className="brand-logo" aria-hidden="true">
        👏
      </div>
      <div>
        <p className="brand-label">{label}</p>
        {caption ? <p className="brand-caption">{caption}</p> : null}
      </div>
    </div>
  );
}
