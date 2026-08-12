import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { downloadReviewerFile, viewFile } from '../services/api.js';
import {
  buildInboxAnalytics,
  buildInboxReportRows,
  exportInboxToExcel,
  exportInboxToPDF,
} from '../utils/inboxReportUtils';
import SubmissionAnalyticsPanel from './SubmissionAnalyticsPanel';
import './InboxReportModal.css';

const ReportIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

const buildFilterChips = (filterSummary) => {
  if (!filterSummary) return [];
  const chips = [];
  if (filterSummary.department) chips.push({ label: 'Faculty', value: filterSummary.department });
  if (filterSummary.senderType && filterSummary.senderType !== 'All') {
    const senderTypeLabel = filterSummary.senderType === 'Student' ? 'Researcher' : filterSummary.senderType;
    chips.push({ label: 'Sender', value: senderTypeLabel });
  }
  if (filterSummary.reviewer) chips.push({ label: 'Reviewer', value: filterSummary.reviewer });
  if (filterSummary.student) chips.push({ label: 'Researcher', value: filterSummary.student });
  if (filterSummary.search) chips.push({ label: 'Search', value: `"${filterSummary.search}"` });
  return chips;
};

const MENU_WIDTH = 280;
const MENU_MAX_HEIGHT = 320;

const ReportFilesDropdown = ({ files, dropdownId, isReviewer, openId, onToggle }) => {
  const [busyFileKey, setBusyFileKey] = useState(null);
  const [menuPosition, setMenuPosition] = useState(null);
  const triggerRef = useRef(null);
  const isOpen = openId === dropdownId;
  const downloadableFiles = (files || []).filter((f) => f.downloadable && f.storedName);

  const updateMenuPosition = () => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < MENU_MAX_HEIGHT && rect.top > MENU_MAX_HEIGHT;
    let left = rect.right - MENU_WIDTH;
    left = Math.max(12, Math.min(left, window.innerWidth - MENU_WIDTH - 12));

    setMenuPosition({
      left,
      top: openUpward ? rect.top - 8 : rect.bottom + 6,
      transform: openUpward ? 'translateY(-100%)' : 'none',
      maxHeight: Math.min(MENU_MAX_HEIGHT, openUpward ? rect.top - 16 : spaceBelow - 16),
    });
  };

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return undefined;
    }
    updateMenuPosition();
    const onScrollOrResize = () => updateMenuPosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [isOpen]);

  if (!files?.length) {
    return <span className="imr-muted">None</span>;
  }

  const handleDownload = async (file, fileKey) => {
    if (!file.storedName) return;
    setBusyFileKey(fileKey);
    try {
      await downloadReviewerFile(file.storedName, file.displayName);
    } catch (err) {
      console.error('Report file download failed:', err);
      window.alert(`Could not download "${file.displayName}". Please try again.`);
    } finally {
      setBusyFileKey(null);
    }
  };

  const menuContent = isOpen && menuPosition && (
    <div
      className="imr-files-dropdown-menu imr-files-dropdown-menu--portal"
      style={{
        position: 'fixed',
        left: menuPosition.left,
        top: menuPosition.top,
        width: MENU_WIDTH,
        maxHeight: menuPosition.maxHeight,
        transform: menuPosition.transform,
        zIndex: 1200,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="imr-files-dropdown-menu-scroll">
        {files.map((file, fileIdx) => {
          const fileKey = `${dropdownId}-${fileIdx}`;
          const canAccess = file.downloadable && file.storedName;
          return (
            <div key={fileKey} className="imr-files-dropdown-item">
              <div className="imr-files-dropdown-item-info">
                {isReviewer && file.fieldLabel && (
                  <span className="imr-file-field">{file.fieldLabel}</span>
                )}
                <span className="imr-file-name" title={file.displayName}>
                  {file.displayName}
                </span>
                {file.sizeLabel && (
                  <span className="imr-file-size">{file.sizeLabel}</span>
                )}
              </div>
              <div className="imr-files-dropdown-item-actions">
                {canAccess ? (
                  <>
                    <button
                      type="button"
                      className="imr-file-action imr-file-action--view"
                      title="View file"
                      disabled={busyFileKey === fileKey}
                      onClick={() => viewFile(file.storedName)}
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="imr-file-action imr-file-action--download"
                      title="Download file"
                      disabled={busyFileKey === fileKey}
                      onClick={() => handleDownload(file, fileKey)}
                    >
                      {busyFileKey === fileKey ? '…' : 'Download'}
                    </button>
                  </>
                ) : (
                  <span className="imr-file-unavailable" title="File reference missing on server">
                    Unavailable
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {downloadableFiles.length === 0 && (
          <p className="imr-files-dropdown-note">File names are listed but storage IDs are missing.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="imr-files-dropdown">
      <button
        ref={triggerRef}
        type="button"
        className={`imr-files-dropdown-trigger${isOpen ? ' imr-files-dropdown-trigger--open' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(isOpen ? null : dropdownId);
        }}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
        {files.length} {files.length === 1 ? 'file' : 'files'}
        <svg
          className={`imr-files-chevron${isOpen ? ' imr-files-chevron--open' : ''}`}
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          aria-hidden
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {menuContent && createPortal(menuContent, document.body)}
    </div>
  );
};

const SubmissionTable = ({ rows, variant }) => {
  const [openFilesId, setOpenFilesId] = useState(null);

  useEffect(() => {
    if (!openFilesId) return undefined;
    const close = () => setOpenFilesId(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [openFilesId]);

  useEffect(() => {
    if (!openFilesId) return undefined;
    const close = () => setOpenFilesId(null);
    const body = document.querySelector('.imr-body');
    const tableWraps = document.querySelectorAll('.imr-section--table .imr-table-wrap');
    body?.addEventListener('scroll', close, { passive: true });
    tableWraps.forEach((el) => el.addEventListener('scroll', close, { passive: true }));
    return () => {
      body?.removeEventListener('scroll', close);
      tableWraps.forEach((el) => el.removeEventListener('scroll', close));
    };
  }, [openFilesId]);

  if (rows.length === 0) {
    return (
      <p className="imr-empty-section">
        No {variant === 'student' ? 'researcher' : 'reviewer'} submissions in this report.
      </p>
    );
  }

  const isReviewer = variant === 'reviewer';

  return (
    <div className="imr-table-wrap">
      <table className="imr-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Date</th>
            <th>Name</th>
            <th>What was submitted</th>
            {isReviewer && <th>Protocol</th>}
            {isReviewer && <th>Decision</th>}
            {!isReviewer && <th>Faculty</th>}
            <th>Subject</th>
            <th>Attached files</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const rowDropdownId = `${variant}-${row.messageId || row.no}`;
            const isRowMenuOpen = openFilesId === rowDropdownId;
            return (
            <tr
              key={`${variant}-${row.no}-${idx}`}
              className={isRowMenuOpen ? 'imr-row-menu-open' : undefined}
            >
              <td className="imr-td-num">{idx + 1}</td>
              <td className="imr-td-date">
                <span className="imr-date-main">{row.date}</span>
                <span className="imr-date-sub">{row.time}</span>
              </td>
              <td className="imr-td-sender">
                <span className="imr-sender-name">{row.senderName}</span>
                <span className="imr-sender-email">{row.senderEmail}</span>
              </td>
              <td>
                <span className={`imr-kind imr-kind--${variant}`}>{row.submissionKind}</span>
              </td>
              {isReviewer && (
                <td className="imr-protocol">{row.protocolCode || '—'}</td>
              )}
              {isReviewer && (
                <td>
                  <span className="imr-decision">{row.reviewDecision || '—'}</span>
                </td>
              )}
              {!isReviewer && (
                <td>
                  <span className="imr-dept-code" title={row.departmentName}>
                    {row.departmentCode}
                  </span>
                </td>
              )}
              <td className="imr-td-subject" title={row.subject}>
                {row.subject}
              </td>
              <td className="imr-td-files">
                <ReportFilesDropdown
                  files={row.files}
                  dropdownId={rowDropdownId}
                  isReviewer={isReviewer}
                  openId={openFilesId}
                  onToggle={setOpenFilesId}
                />
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
};

const InboxReportModal = ({
  isOpen,
  onClose,
  messages,
  getMessageMetadata,
  departmentNames,
  filterSummary,
}) => {
  const [exporting, setExporting] = useState(null);

  const rows = useMemo(
    () => buildInboxReportRows(messages, getMessageMetadata, departmentNames),
    [messages, getMessageMetadata, departmentNames]
  );

  const analytics = useMemo(() => buildInboxAnalytics(rows), [rows]);
  const filterChips = buildFilterChips(filterSummary);
  const filterLabel = filterChips.length
    ? filterChips.map((c) => `${c.label}: ${c.value}`).join(' | ')
    : 'All visible records';

  const handleExport = async (format) => {
    if (rows.length === 0) return;
    setExporting(format);
    try {
      if (format === 'excel') exportInboxToExcel(rows, filterLabel, analytics);
      else exportInboxToPDF(rows, analytics, filterLabel);
    } finally {
      setTimeout(() => setExporting(null), 600);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="imr-overlay" onClick={onClose}>
      <div className="imr-modal" onClick={(e) => e.stopPropagation()}>
        <header className="imr-header">
          <div className="imr-header-left">
            <div className="imr-header-icon">
              <ReportIcon />
            </div>
            <div className="imr-header-text">
              <h2 className="imr-title">Submissions Report</h2>
              <p className="imr-subtitle">Clear summary of researcher and reviewer submissions</p>
            </div>
          </div>
          <div className="imr-header-actions">
            <span className="imr-record-badge">{analytics.total} total</span>
          </div>
          <button type="button" className="imr-close" onClick={onClose} aria-label="Close report">
            <span className="imr-close-x" aria-hidden>×</span>
          </button>
        </header>

        {filterChips.length > 0 && (
          <div className="imr-filters">
            <span className="imr-filters-label">Filters applied</span>
            <div className="imr-filter-chips">
              {filterChips.map((chip) => (
                <span key={`${chip.label}-${chip.value}`} className="imr-chip">
                  <span className="imr-chip-key">{chip.label}</span>
                  <span className="imr-chip-val">{chip.value}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="imr-body">
          {rows.length === 0 ? (
            <div className="imr-empty">
              <h3>No submissions to show</h3>
              <p>Select a faculty and filters in the inbox, then open the report again.</p>
            </div>
          ) : (
            <>
              <SubmissionAnalyticsPanel analytics={analytics} />

              {analytics.unknownCount > 0 && (
                <section className="imr-section imr-section--table">
                  <div className="imr-section-head">
                    <h3 className="imr-section-title">Unclassified</h3>
                    <span className="imr-table-count">{analytics.unknownCount} records</span>
                  </div>
                  <p className="imr-unknown-note">
                    These could not be matched to a researcher or reviewer account. Check sender email or message type in the system.
                  </p>
                  <SubmissionTable rows={analytics.unknownRows} variant="student" />
                </section>
              )}

              <section className="imr-section imr-section--table">
                <div className="imr-section-head">
                  <h3 className="imr-section-title imr-section-title--student">
                    Researcher submissions
                  </h3>
                  <span className="imr-table-count">{analytics.students.count} records</span>
                </div>
                <SubmissionTable rows={analytics.studentRows} variant="student" />
              </section>

              <section className="imr-section imr-section--table">
                <div className="imr-section-head">
                  <h3 className="imr-section-title imr-section-title--reviewer">
                    Reviewer submissions
                  </h3>
                  <span className="imr-table-count">{analytics.reviewers.count} records</span>
                </div>
                <SubmissionTable rows={analytics.reviewerRows} variant="reviewer" />
              </section>
            </>
          )}
        </div>

        <footer className="imr-footer">
          <p className="imr-footer-note">
            Researcher = messages/files from researchers. Reviewer = review results and files from reviewers.
          </p>
          <div className="imr-export-btns">
            <button type="button" className="imr-btn imr-btn--ghost" onClick={onClose}>
              Close
            </button>
            <button
              type="button"
              className="imr-btn imr-btn--excel"
              disabled={rows.length === 0 || exporting}
              onClick={() => handleExport('excel')}
            >
              {exporting === 'excel' ? 'Exporting…' : 'Export Excel'}
            </button>
            <button
              type="button"
              className="imr-btn imr-btn--pdf"
              disabled={rows.length === 0 || exporting}
              onClick={() => handleExport('pdf')}
            >
              {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default InboxReportModal;
