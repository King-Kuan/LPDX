import { APP_SHORT_NAME, RIGHTS_HOLDER } from "@/lib/constants";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand-mark" aria-label={APP_SHORT_NAME}>
      <div className="brand-mark__logo">LP</div>
      {!compact ? (
        <div className="brand-mark__text">
          <strong>{APP_SHORT_NAME}</strong>
          <span>{RIGHTS_HOLDER}</span>
        </div>
      ) : null}
    </div>
  );
}
