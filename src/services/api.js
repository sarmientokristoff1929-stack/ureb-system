// API service for client-side requests — empty VITE_API_URL uses same-origin `/api` (Vite dev proxy → server)
const apiOrigin = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
export const API_BASE_URL = apiOrigin ? `${apiOrigin}/api` : '/api';

// Authentication
export const authenticateUser = async (email, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success && data.user && data.user.profilePicture) {
      if (data.user.profilePicture.startsWith('/api') && API_BASE_URL.startsWith('http')) {
        data.user.profilePicture = `${API_BASE_URL.replace(/\/api$/, '')}${data.user.profilePicture}`;
      }
    }
    return data;
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false, error: 'Server error' };
  }
};

// Dashboard stats
export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/stats`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalProposals: 0,
      pendingReviews: 0,
      approved: 0,
      activeReviewers: 0,
      studentProposals: 0,
      reviewerProposals: 0,
      onlineResearchers: 0,
      onlineReviewers: 0,
      onlineResearchersNames: [],
      onlineReviewersNames: []
    };
  }
};

// Realtime presence — pings the server so this Researcher/Reviewer counts as
// "active" in the Admin Dashboard's System Realtime stat cards.
export const sendHeartbeat = async (email, role) => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    return await response.json();
  } catch (error) {
    // Silent — a missed heartbeat just means this tick won't count as "online"
    return { success: false };
  }
};

// Explicit sign-off — tells the server this Researcher/Reviewer is no longer
// online (logout button, or the tab/window closing), so they drop out of the
// Admin Dashboard's active count right away instead of waiting for their last
// heartbeat to age out. Uses sendBeacon so it still fires during page unload,
// when a normal fetch could get cancelled before it reaches the server.
export const sendSignOff = (email, role) => {
  if (!email || !role) return;
  try {
    const payload = JSON.stringify({ email, role });
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE_URL}/auth/signoff`, blob);
    } else {
      fetch(`${API_BASE_URL}/auth/signoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch (error) {
    // Best-effort — a missed signoff just means the active window has to age out
  }
};

// Proposals
export const getAllProposals = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return [];
  }
};

export const assignStudentProposalReviewer = async (proposalId, { department, preliminaryReviewer }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/assign-preliminary`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ department, preliminaryReviewer }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assigning student proposal reviewer:', error);
    return { success: false, error: 'Failed to assign reviewer' };
  }
};

export const markStudentProposalSeen = async (proposalId) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/proposals/${encodeURIComponent(proposalId)}/mark-seen`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      }
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to mark proposal as seen (${response.status})`,
      };
    }
    return data;
  } catch (error) {
    console.error('Error marking student proposal as seen:', error);
    return { success: false, error: 'Failed to mark proposal as seen' };
  }
};

export const getProposalsByReviewer = async (reviewerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/reviewer/${reviewerId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviewer proposals:', error);
    return [];
  }
};

// Create new proposal with file uploads
export const createProposal = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals`, {
      method: 'POST',
      body: formData, // FormData object (no Content-Type header needed for multipart)
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating proposal:', error);
    return { success: false, error: 'Failed to create proposal' };
  }
};

export const updateProposalStatus = async (proposalId, status) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error updating proposal status:', error);
    return { success: false, error: 'Failed to update proposal status' };
  }
};

// Reviews
export const getReviewsByReviewer = async (reviewerId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/reviewer/${reviewerId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

// Submit a review (supports file uploads via FormData)
export const submitReview = async (reviewData) => {
  try {
    const formData = new FormData();

    // Append text fields
    formData.append('proposalId', reviewData.proposalId || '');
    formData.append('reviewerEmail', reviewData.reviewerEmail || '');
    formData.append('reviewerName', reviewData.reviewerName || '');
    formData.append('decision', reviewData.decision || '');
    formData.append('comment', reviewData.comment || '');
    formData.append('protocolCode', reviewData.protocolCode || '');

    // Append file fields if they exist
    const fileFields = [
      'proposal', 'approvalSheet', 'urebForm2', 'urebForm10B', 'urebForm11',
      'applicationForm6', 'accomplishedForm8', 'accomplishForm10A',
      'copyOfInstrument', 'ethicsReviewFee', 'form7', 'sampleForm1', 'sampleForm2'
    ];
    fileFields.forEach(field => {
      if (reviewData[field] instanceof File) {
        console.log(`Appending ${field}:`, reviewData[field].name, reviewData[field].size);
        formData.append(field, reviewData[field]);
      }
    });

    // Append additional files if they exist
    if (reviewData.additionalFiles && Array.isArray(reviewData.additionalFiles)) {
      console.log('Additional files count:', reviewData.additionalFiles.length);
      reviewData.additionalFiles.forEach((file, index) => {
        console.log(`Additional file ${index}:`, file instanceof File, file?.name, file?.size);
        if (file instanceof File) {
          formData.append(`additionalFile${index}`, file);
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      body: formData, // No Content-Type header — browser sets it with boundary
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to submit review';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If we can't parse JSON, use status text
        errorMessage = `Failed to submit review: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
};

// Resubmit an updated file for an already-submitted review (Reviewer -> Admin)
export const resubmitReview = async (reviewId, resubmitData) => {
  try {
    const formData = new FormData();
    formData.append('reviewerEmail', resubmitData.reviewerEmail || '');
    formData.append('reviewerName', resubmitData.reviewerName || '');
    formData.append('resubmissionReason', resubmitData.resubmissionReason || '');

    // files: { [documentFieldKey]: File } — keeps each replacement under its original document slot
    if (resubmitData.files && typeof resubmitData.files === 'object') {
      Object.entries(resubmitData.files).forEach(([fieldKey, file]) => {
        if (file instanceof File) {
          formData.append(fieldKey, file);
        }
      });
    }

    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/resubmit`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = 'Failed to resubmit review';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `Failed to resubmit review: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    return await response.json();
  } catch (error) {
    console.error('Error resubmitting review:', error);
    return { success: false, error: 'Failed to resubmit review' };
  }
};

// Get completed reviews by reviewer email
export const getCompletedReviews = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviews/completed/${encodeURIComponent(email)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching completed reviews:', error);
    return [];
  }
};

// Notifications
export const getNotifications = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: 'PUT',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: 'Failed to mark notification as read' };
  }
};

export const deleteNotification = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${id}/delete`, {
      method: 'POST',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: 'Failed to delete notification' };
  }
};

export const markAllNotificationsAsRead = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
};

// Messages
export const getMessagesByUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${encodeURIComponent(userId)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
};

export const sendMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

export const sendStudentMessageToAdmin = async ({ senderEmail, senderName, subject, message, attachments = [] }) => {
  try {
    const formData = new FormData();
    formData.append('senderEmail', senderEmail || '');
    formData.append('senderName', senderName || 'Student');
    formData.append('subject', subject || 'Message from Student');
    formData.append('message', message);
    const files = attachments.filter((file) => file instanceof File);
    formData.append('attachmentCount', String(files.length));
    files.forEach((file, index) => {
      const name = file.name || `attachment-${index + 1}`;
      formData.append('attachments', file, name);
    });

    const response = await fetch(`${API_BASE_URL}/messages/student-to-admin`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Failed to send message (${response.status})`,
        filesReceived: data.filesReceived ?? 0,
      };
    }
    return data;
  } catch (error) {
    console.error('Error sending student message to admin:', error);
    return { success: false, error: 'Failed to send message' };
  }
};

export const sendEmail = async (emailData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: 'Failed to send email' };
  }
};

export const deleteMessage = async (messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting message:', error);
    return { success: false, error: 'Failed to delete message' };
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${messageId}/read`, {
      method: 'PUT',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking message as read:', error);
    return { success: false, error: 'Failed to mark message as read' };
  }
};

export const markAllMessagesAsRead = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/read-all`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error marking all messages as read:', error);
    return { success: false, error: 'Failed to mark messages as read' };
  }
};

// Users
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const getAllStudents = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/students`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching students:', error);
    return [];
  }
};

export const getAllReviewers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviewers`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviewers:', error);
    return [];
  }
};

export const addReviewer = async (reviewerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/detailed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewerData),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create reviewer';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        errorMessage = `Failed to create reviewer: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating reviewer:', error);
    return { success: false, error: 'Failed to create reviewer' };
  }
};

// Update user
export const updateUser = async (id, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to update user';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If we can't parse JSON, use status text
        errorMessage = `Failed to update user: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: 'Failed to update user' };
  }
};

// Delete user
export const deleteUser = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: 'Failed to delete user' };
  }
};

// Change reviewer password
export const changeReviewerPassword = async (email, currentPassword, newPassword) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviewer/change-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, currentPassword, newPassword }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error changing reviewer password:', error);
    return { success: false, error: 'Failed to change password' };
  }
};

// Update reviewer
export const updateReviewer = async (id, reviewerData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviewers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reviewerData),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to update reviewer';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If we can't parse JSON, use status text
        errorMessage = `Failed to update reviewer: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating reviewer:', error);
    return { success: false, error: 'Failed to update reviewer' };
  }
};

// Delete reviewer
export const deleteReviewer = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviewers/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting reviewer:', error);
    return { success: false, error: 'Failed to delete reviewer' };
  }
};

// Update student
export const updateStudent = async (id, studentData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    });

    // Check if response is ok before trying to parse JSON
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to update student';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (jsonError) {
        // If we can't parse JSON, use status text
        errorMessage = `Failed to update student: ${response.statusText} (${response.status})`;
      }
      return { success: false, error: errorMessage };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating student:', error);
    return { success: false, error: 'Failed to update student' };
  }
};

// Delete student
export const deleteStudent = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/students/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting student:', error);
    return { success: false, error: 'Failed to delete student' };
  }
};

// Get proposal by ID
export const getProposalById = async (proposalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return null;
  }
};

// Delete proposal (cascades to its reviewer assignments on the server)
export const deleteProposal = async (proposalId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/proposals/${proposalId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || 'Failed to delete proposal' };
    }
    return data;
  } catch (error) {
    console.error('Error deleting proposal:', error);
    return { success: false, error: 'Failed to delete proposal' };
  }
};

// File download
export const downloadFile = (filename) => {
  const link = document.createElement('a');
  link.href = `${API_BASE_URL.replace('/api', '')}/uploads/${filename}`;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// File view - open file in browser for preview
export const viewFile = (filename) => {
  if (!filename) return;

  const fileExt = filename.split('.').pop().toLowerCase();
  const isWordFile = ['doc', 'docx'].includes(fileExt);
  const isExcelFile = ['xls', 'xlsx'].includes(fileExt);

  if (isWordFile || isExcelFile) {
    // Use Microsoft Office Online Viewer for Office documents
    const encodedUrl = encodeURIComponent(`${API_BASE_URL}/view/${encodeURIComponent(filename)}`);
    const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodedUrl}`;
    window.open(officeViewerUrl, '_blank', 'noopener,noreferrer');
  } else {
    // For PDFs, images, and other viewable files, use direct view
    const viewUrl = `${API_BASE_URL}/view/${encodeURIComponent(filename)}`;
    window.open(viewUrl, '_blank', 'noopener,noreferrer');
  }
};

// Get notifications for a specific user
export const getUserNotifications = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notifications/${email}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
};

// Get a reviewer's profile (status, etc.) by email
export const getReviewerProfile = async (email) => {
  try {
    const response = await fetch(`${API_BASE_URL}/reviewers`);
    const data = await response.json();
    if (!Array.isArray(data)) return null;
    return data.find(r => (r.email || '').toLowerCase() === (email || '').toLowerCase()) || null;
  } catch (error) {
    console.error('Error fetching reviewer profile:', error);
    return null;
  }
};

// Get assignments for a specific reviewer
export const getReviewerAssignments = async (reviewerEmail) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assignments/${encodeURIComponent(reviewerEmail)}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching reviewer assignments:', error);
    return [];
  }
};

// Assign file to reviewer
export const assignFileToReviewer = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/assign-file-to-reviewer`, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error assigning file to reviewer:', error);
    return { success: false, error: 'Failed to assign file to reviewer' };
  }
};

// Download reviewer submitted file
export const downloadReviewerFile = async (filename, originalName) => {
  try {
    const downloadUrl = `${API_BASE_URL.replace('/api', '')}/api/download/${filename}?name=${encodeURIComponent(originalName)}`;

    // Try to download the file directly
    const response = await fetch(downloadUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    // Create download link
    const link = document.createElement('a');
    link.href = url;
    link.download = originalName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Download failed:', error);
    return { success: false, error: error.message };
  }
};
