interface OverviewSectionProps {
  overviewText: string | null;
  loading: boolean;
  error: string | null;
}

export function OverviewSection({ overviewText, loading, error }: OverviewSectionProps) {
  if (loading) return <div className="overview-section">Đang tạo bài tổng quan...</div>;
  if (error) return <div className="overview-section error">Lỗi tổng quan: {error}</div>;
  if (overviewText === null) return null;
  return (
    <div className="overview-section">
      <h2>Tổng quan</h2>
      <p>{overviewText}</p>
    </div>
  );
}
