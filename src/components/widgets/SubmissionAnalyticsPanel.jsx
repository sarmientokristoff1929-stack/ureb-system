import './SubmissionAnalyticsPanel.css';

const SubmissionAnalyticsPanel = ({ analytics }) => {
  const { students, reviewers, studentPct, total, byRead, totalFiles } = analytics;
  const reviewerPct = 100 - studentPct;
  const totalCount = students.count + reviewers.count;

  const gradient = totalCount
    ? `conic-gradient(#4a7c59 0% ${studentPct}%, #0ea5e9 ${studentPct}% 100%)`
    : '#e2e8f0';

  return (
    <section className="sap-section sap-section--simple">
      <h3 className="sap-title">Analytics at a glance</h3>

      <div className="sap-simple-row">
        <div className="sap-donut-block">
          <div className="sap-donut" style={{ background: gradient }}>
            <div className="sap-donut-hole">
              <strong>{totalCount}</strong>
              <span>total</span>
            </div>
          </div>
          <div className="sap-donut-labels">
            <span className="sap-tag sap-tag--student">
              Researchers {students.count} ({studentPct}%)
            </span>
            <span className="sap-tag sap-tag--reviewer">
              Reviewers {reviewers.count} ({reviewerPct}%)
            </span>
          </div>
        </div>

        <div className="sap-compare-col sap-compare-col--student">
          <h4>Researchers</h4>
          <dl className="sap-stat-list">
            <div>
              <dt>Submissions</dt>
              <dd>{students.count}</dd>
            </div>
            <div>
              <dt>Files attached</dt>
              <dd>{students.totalFiles}</dd>
            </div>
            <div>
              <dt>Unread</dt>
              <dd>{students.readStats.unread}</dd>
            </div>
          </dl>
        </div>

        <div className="sap-compare-col sap-compare-col--reviewer">
          <h4>Reviewers</h4>
          <dl className="sap-stat-list">
            <div>
              <dt>Submissions</dt>
              <dd>{reviewers.count}</dd>
            </div>
            <div>
              <dt>Files attached</dt>
              <dd>{reviewers.totalFiles}</dd>
            </div>
            <div>
              <dt>Unread</dt>
              <dd>{reviewers.readStats.unread}</dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="sap-footnote">
        {total} submission{total !== 1 ? 's' : ''} · {totalFiles} file{totalFiles !== 1 ? 's' : ''} ·{' '}
        {byRead.Unread || 0} unread
      </p>
    </section>
  );
};

export default SubmissionAnalyticsPanel;
