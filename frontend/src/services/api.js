import axios from "axios";
import { API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Unwrap our API envelope: { success, data, error } → just data
api.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "success" in response.data
    ) {
      response.data = response.data.data ?? response.data;
    }
    return response;
  },
  (error) => Promise.reject(error),
);

// Auth
export const signup = (name, email, password) =>
  api.post("/api/auth/signup", { name, email, password });

export const login = (email, password) =>
  api.post("/api/auth/login", { email, password });

// Audio Processing
export const processAudio = (formData) =>
  api.post("/api/process-audio", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const processTranscript = (transcript, userId, title) =>
  api.post("/api/process-transcript", { transcript, user_id: userId, title });

// Meetings
export const getMeetings = (userId) =>
  api.get(`/api/meetings?user_id=${userId}`);

export const getMeeting = (meetingId) => api.get(`/api/meetings/${meetingId}`);

// Reports
export const getReport = (meetingId) =>
  api.get(`/api/meetings/${meetingId}/report`);

export const updateReport = (meetingId, data) =>
  api.put(`/api/meetings/${meetingId}/report`, data);

export const sendReport = (meetingId, emails) =>
  api.post(`/api/meetings/${meetingId}/report/send`, { emails });

// Action Items
export const getActionItems = (userId) =>
  api.get(`/api/action-items?user_id=${userId}`);

export const updateActionItem = (itemId, data) =>
  api.patch(`/api/action-items/${itemId}`, data);

// Reminders
export const createReminder = (data) => api.post("/api/reminders", data);

export const getReminders = (userId) =>
  api.get(`/api/reminders?user_id=${userId}`);

export const deleteReminder = (id) => api.delete(`/api/reminders/${id}`);

// Dashboard
export const getDashboard = (userId) =>
  api.get(`/api/dashboard?user_id=${userId}`);

export default api;
