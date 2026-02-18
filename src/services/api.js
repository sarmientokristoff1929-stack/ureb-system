// API service for client-side requests
const API_BASE_URL = 'http://localhost:5001/api';

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
      activeReviewers: 0
    };
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

    // Append file fields if they exist
    const fileFields = [
      'proposal', 'approvalSheet', 'urebForm2', 'applicationForm6',
      'accomplishedForm8', 'accomplishForm10A', 'copyOfInstrument',
      'ethicsReviewFee', 'form7'
    ];
    fileFields.forEach(field => {
      if (reviewData[field] instanceof File) {
        formData.append(field, reviewData[field]);
      }
    });

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      body: formData, // No Content-Type header — browser sets it with boundary
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'Failed to submit review' };
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
    const response = await fetch(`${API_BASE_URL}/messages/${userId}`);
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
