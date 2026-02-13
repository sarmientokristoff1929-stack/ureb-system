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
