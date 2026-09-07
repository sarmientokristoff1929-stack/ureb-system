const REVIEWER_FILE_FIELD_LABELS = {
    proposal: 'Proposal',
    approvalSheet: 'Approval Sheet',
    urebForm2: 'UREB Form 2',
    urebForm10B: 'UREB Form 10B',
    urebForm11: 'UREB Form 11',
    urebForm16: 'UREB Form 16',
    instrumentTool: 'Instrument Tool',
    ethicsReviewFee: 'Ethics Review Fee',
};

export const formatFileSize = (bytes) => {
    if (!bytes || Number.isNaN(bytes)) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

const humanizeFieldKey = (key) => {
    if (!key) return '';
    if (REVIEWER_FILE_FIELD_LABELS[key]) return REVIEWER_FILE_FIELD_LABELS[key];
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^\w/, (c) => c.toUpperCase())
        .trim();
};

/** GridFS / disk filename used by /api/download and /api/view. */
export function resolveStoredFilename(file) {
    const raw = file?.filename || file?.path || '';
    if (!raw) return '';
    const cleaned = String(raw).trim();
    if (!cleaned.includes('/')) return cleaned.split('?')[0];
    const segment = cleaned.split('/').filter(Boolean).pop() || cleaned;
    return segment.split('?')[0];
}

/** One normalized file record for reports and exports. */
export function normalizeReportFile(file, fieldKey = '') {
    const key = fieldKey || file?.fieldKey || '';
    const storedName = resolveStoredFilename(file);
    const displayName =
        file?.originalname
        || humanizeFieldKey(key)
        || storedName
        || 'Unnamed file';

    return {
        displayName: String(displayName).trim(),
        storedName,
        fieldKey: key,
        fieldLabel: humanizeFieldKey(key),
        size: file?.size,
        sizeLabel: formatFileSize(file?.size),
        downloadable: Boolean(storedName),
    };
}

/** Normalize attached files (array or reviewer object map). */
export function getMessageFileList(message) {
    if (!message?.files) return [];
    let list = message.files;

    if (Array.isArray(list)) {
        return list
            .filter((f) => f && (f.filename || f.originalname || f.path))
            .map((f) => normalizeReportFile(f));
    }

    return Object.entries(list)
        .map(([key, file]) => {
            if (!file || typeof file !== 'object') return null;
            return normalizeReportFile(file, key);
        })
        .filter(Boolean);
}

/** Pull protocol code from stored field or message text. */
export function extractProtocolCode(message) {
    if (message?.protocolCode) return String(message.protocolCode).trim();
    const text = `${message?.subject || ''} ${message?.message || ''}`;
    const match = text.match(/Protocol\s*(?:Code)?[:\s]+([A-Za-z0-9][A-Za-z0-9\-_/]*)/i);
    return match ? match[1] : '';
}

/** Human-readable submission type for the report. */
export function getSubmissionKind(message) {
    if (message?.type === 'reviewer_to_admin') {
        return 'Reviewer Review Submission';
    }
    if (message?.submissionType === 'resubmission') {
        return 'Researcher Proposal Resubmission';
    }
    if (message?.type === 'student_to_admin') {
        const files = getMessageFileList(message);
        const hasMessage = Boolean((message.message || '').trim());
        if (files.length > 0 && !hasMessage) return 'Researcher File Upload';
        if (files.length > 0) return 'Researcher Message with Files';
        return 'Researcher Message';
    }
    return 'Other';
}

export function buildInboxReportRows(messages, getMessageMetadata, departmentNames) {
    return (messages || []).map((msg, index) => {
        const meta = getMessageMetadata(msg);
        const type = meta.type;
        const files = getMessageFileList(msg);
        const dateObj = new Date(msg.createdAt || msg.sentAt);
        const validDate = !Number.isNaN(dateObj.getTime());
        const isReviewer = type === 'reviewer';
        const isStudent = type === 'student';

        return {
            no: index + 1,
            messageId: msg._id || msg.id || `row-${index}`,
            isoDate: validDate ? dateObj.toISOString() : '',
            date: validDate
                ? dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : 'N/A',
            time: validDate
                ? dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : 'N/A',
            senderName: meta.name || 'Unknown',
            senderEmail: msg.senderEmail || 'N/A',
            senderGroup: isReviewer ? 'Reviewer' : isStudent ? 'Researcher' : 'Unclassified',
            role: isReviewer ? 'Reviewer' : isStudent ? 'Researcher' : 'Unknown',
            departmentCode: meta.department || 'N/A',
            departmentName: departmentNames?.[meta.department] || meta.department || 'N/A',
            submissionKind: getSubmissionKind(msg),
            protocolCode: extractProtocolCode(msg) || (isReviewer ? '—' : ''),
            reviewDecision: isReviewer ? (msg.decision || msg.overallRating || '—') : '',
            subject: msg.subject || '(No subject)',
            message: (msg.message || '').replace(/\s+/g, ' ').trim(),
            systemType: msg.type || '—',
            readStatus: msg.read ? 'Read' : 'Unread',
            fileCount: files.length,
            files,
            fileNames: files.map((f) => f.displayName).join('; '),
            fileNamesDetailed: files
                .map((f) => {
                    const parts = [f.displayName];
                    if (f.fieldLabel && f.fieldLabel !== f.displayName) parts.unshift(f.fieldLabel);
                    if (f.sizeLabel) parts.push(`(${f.sizeLabel})`);
                    return parts.join(' ');
                })
                .join('; '),
        };
    });
}

export function buildInboxAnalytics(rows) {
    const studentRows = rows.filter((r) => r.role === 'Researcher');
    const reviewerRows = rows.filter((r) => r.role === 'Reviewer');
    const unknownRows = rows.filter((r) => r.role === 'Unknown');

    const summarizeGroup = (groupRows) => {
        let totalFiles = 0;
        let withFiles = 0;
        const byKind = {};
        groupRows.forEach((row) => {
            totalFiles += row.fileCount;
            if (row.fileCount > 0) withFiles += 1;
            byKind[row.submissionKind] = (byKind[row.submissionKind] || 0) + 1;
        });
        return {
            count: groupRows.length,
            withFiles,
            withoutFiles: groupRows.length - withFiles,
            totalFiles,
            byKind: Object.entries(byKind).sort((a, b) => b[1] - a[1]),
        };
    };

    const readStats = (groupRows) => {
        let read = 0;
        let unread = 0;
        groupRows.forEach((row) => {
            if (row.readStatus === 'Read') read += 1;
            else unread += 1;
        });
        return { read, unread };
    };

    const students = { ...summarizeGroup(studentRows), readStats: readStats(studentRows) };
    const reviewers = { ...summarizeGroup(reviewerRows), readStats: readStats(reviewerRows) };

    const byRead = { Read: 0, Unread: 0 };
    rows.forEach((row) => {
        byRead[row.readStatus] = (byRead[row.readStatus] || 0) + 1;
    });

    const reviewerDecisions = {};
    reviewerRows.forEach((row) => {
        const d = (row.reviewDecision || '').trim();
        if (!d || d === '—') return;
        reviewerDecisions[d] = (reviewerDecisions[d] || 0) + 1;
    });
    const decisionEntries = Object.entries(reviewerDecisions).sort((a, b) => b[1] - a[1]);

    const byMonthStudent = {};
    const byMonthReviewer = {};
    studentRows.forEach((row) => {
        if (!row.isoDate) return;
        const key = new Date(row.isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        byMonthStudent[key] = (byMonthStudent[key] || 0) + 1;
    });
    reviewerRows.forEach((row) => {
        if (!row.isoDate) return;
        const key = new Date(row.isoDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        byMonthReviewer[key] = (byMonthReviewer[key] || 0) + 1;
    });

    const allMonths = [...new Set([...Object.keys(byMonthStudent), ...Object.keys(byMonthReviewer)])].sort(
        (a, b) => new Date(a) - new Date(b)
    );
    const timeline = allMonths.map((month) => ({
        month,
        student: byMonthStudent[month] || 0,
        reviewer: byMonthReviewer[month] || 0,
    }));

    const byDeptStudent = {};
    const byDeptReviewer = {};
    studentRows.forEach((r) => {
        const d = r.departmentCode || 'N/A';
        byDeptStudent[d] = (byDeptStudent[d] || 0) + 1;
    });
    reviewerRows.forEach((r) => {
        const d = r.departmentCode || 'N/A';
        byDeptReviewer[d] = (byDeptReviewer[d] || 0) + 1;
    });
    const deptKeys = [...new Set([...Object.keys(byDeptStudent), ...Object.keys(byDeptReviewer)])];
    const deptComparison = deptKeys
        .map((dept) => ({
            dept,
            student: byDeptStudent[dept] || 0,
            reviewer: byDeptReviewer[dept] || 0,
            total: (byDeptStudent[dept] || 0) + (byDeptReviewer[dept] || 0),
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);

    const studentPct = rows.length ? Math.round((students.count / rows.length) * 100) : 0;

    return {
        total: rows.length,
        students,
        reviewers,
        unknownCount: unknownRows.length,
        unknownRows,
        studentRows,
        reviewerRows,
        byRead,
        totalFiles: students.totalFiles + reviewers.totalFiles,
        decisionEntries,
        timeline,
        deptComparison,
        studentPct,
        reviewerPct: rows.length ? 100 - studentPct : 0,
    };
}

function escapeCsv(value) {
    const str = String(value ?? '');
    if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
    return str;
}

const REPORT_HEADERS = [
    'No.',
    'Sender Group',
    'Submission Type',
    'Date',
    'Time',
    'Sender Name',
    'Sender Email',
    'Department',
    'Protocol Code',
    'Review Decision',
    'Subject',
    'Message',
    'File Count',
    'Attached Files (actual names)',
];

export function exportInboxToExcel(rows, filterLabel, analytics) {
    const lines = [
        '"UREB — Files and Messages Submitted Report"',
        `"Generated: ${new Date().toLocaleString('en-US')}"`,
        `"Filters: ${(filterLabel || 'All').replace(/"/g, '""')}"`,
        '',
        '"SUMMARY"',
        `"Researcher submissions",${analytics.students.count}`,
        `"Reviewer submissions",${analytics.reviewers.count}`,
        `"Researcher files attached",${analytics.students.totalFiles}`,
        `"Reviewer files attached",${analytics.reviewers.totalFiles}`,
        `"Unread",${analytics.byRead.Unread || 0}`,
        '',
        REPORT_HEADERS.map(escapeCsv).join(','),
        ...rows.map((r) =>
            [
                r.no,
                r.senderGroup,
                r.submissionKind,
                r.date,
                r.time,
                r.senderName,
                r.senderEmail,
                r.departmentName,
                r.protocolCode,
                r.reviewDecision,
                r.subject,
                r.message,
                r.fileCount,
                r.fileNamesDetailed || r.fileNames,
            ]
                .map(escapeCsv)
                .join(',')
        ),
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], {
        type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ureb_submissions_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function renderPdfTableRows(groupRows) {
    const esc = (s) =>
        String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    return groupRows
        .map(
            (r) => `
    <tr>
      <td>${r.no}</td>
      <td>${esc(r.date)}</td>
      <td>${esc(r.senderName)}</td>
      <td>${esc(r.submissionKind)}</td>
      <td>${esc(r.protocolCode || '—')}</td>
      <td>${esc(r.subject)}</td>
      <td class="files-cell">${esc(r.fileNamesDetailed || r.fileNames || '—')}</td>
    </tr>`
        )
        .join('');
}

export function exportInboxToPDF(rows, analytics, filterLabel) {
    const dateStr = new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    const esc = (s) =>
        String(s ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>UREB Submissions Report</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 10px; color: #1e293b; }
    header { text-align: center; border-bottom: 2px solid #4a7c59; padding-bottom: 10px; margin-bottom: 14px; }
    h1 { font-size: 16px; margin: 0; color: #14532d; }
    .summary { display: flex; gap: 12px; margin-bottom: 16px; }
    .box { flex: 1; border-radius: 8px; padding: 12px; border: 1px solid #e2e8f0; }
    .box.student { background: #f0fdf4; border-color: #bbf7d0; }
    .box.reviewer { background: #f0f9ff; border-color: #bae6fd; }
    .box h2 { margin: 0 0 8px; font-size: 12px; }
    .box ul { margin: 0; padding-left: 16px; }
    h3 { font-size: 11px; margin: 14px 0 6px; color: #334155; border-left: 4px solid #4a7c59; padding-left: 8px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #f1f5f9; padding: 5px 6px; text-align: left; font-size: 9px; border: 1px solid #cbd5e1; }
    td { padding: 4px 6px; border: 1px solid #e2e8f0; font-size: 9px; }
    td.files-cell { max-width: 200px; word-break: break-word; white-space: normal; }
  </style>
</head>
<body>
  <header>
    <h1>UREB — Files &amp; Messages Submitted</h1>
    <p>Generated: ${esc(dateStr)} | ${esc(filterLabel)}</p>
  </header>
  <div class="summary">
    <div class="box student">
      <h2>Researcher Submissions (${analytics.students.count})</h2>
      <ul>
        <li>With files: ${analytics.students.withFiles}</li>
        <li>Total files: ${analytics.students.totalFiles}</li>
      </ul>
    </div>
    <div class="box reviewer">
      <h2>Reviewer Submissions (${analytics.reviewers.count})</h2>
      <ul>
        <li>With files: ${analytics.reviewers.withFiles}</li>
        <li>Total files: ${analytics.reviewers.totalFiles}</li>
      </ul>
    </div>
  </div>
  <h3>Researcher Submissions</h3>
  <table>
    <thead><tr><th>#</th><th>Date</th><th>Sender</th><th>Type</th><th>Protocol</th><th>Subject</th><th>Attached files</th></tr></thead>
    <tbody>${renderPdfTableRows(analytics.studentRows) || '<tr><td colspan="7">None</td></tr>'}</tbody>
  </table>
  <h3>Reviewer Submissions</h3>
  <table>
    <thead><tr><th>#</th><th>Date</th><th>Sender</th><th>Type</th><th>Protocol</th><th>Subject</th><th>Attached files</th></tr></thead>
    <tbody>${renderPdfTableRows(analytics.reviewerRows) || '<tr><td colspan="7">None</td></tr>'}</tbody>
  </table>
</body>
</html>`;

    const win = window.open('', '_blank', 'width=1200,height=800');
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 700);
}
