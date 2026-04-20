import axios from "axios";

const API_BASE = "https://notebooklm-api-blhk.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true"
  },
});

// Notebooks
export const getNotebooks = async () => {
  const res = await api.get("/notebooks/");
  return res.data;
};

export const createNotebook = async (title: string) => {
  const res = await api.post("/notebooks/", { title });
  return res.data;
};

export const getNotebook = async (id: string) => {
  const res = await api.get(`/notebooks/${id}`);
  return res.data;
};

export const deleteNotebook = async (id: string) => {
  const res = await api.delete(`/notebooks/${id}`);
  return res.data;
};

// Sources
export const getSources = async (notebookId: string) => {
  const res = await api.get(`/sources/${notebookId}`);
  return res.data;
};

export const addUrlSource = async (notebookId: string, url: string) => {
  const res = await api.post("/sources/url", {
    notebook_id: notebookId,
    url,
  });
  return res.data;
};

// Chat
export const sendMessage = async (notebookId: string, message: string) => {
  const res = await api.post("/chat/", {
    notebook_id: notebookId,
    message,
  });
  return res.data;
};

// Notes
export const getNotes = async (notebookId: string) => {
  const res = await api.get(`/notebooks/${notebookId}/notes`);
  return res.data;
};

export const createNote = async (notebookId: string, content: string) => {
  const res = await api.post(`/notebooks/${notebookId}/notes`, { content });
  return res.data;
};

export const deleteNote = async (notebookId: string, noteId: string) => {
  const res = await api.delete(`/notebooks/${notebookId}/notes/${noteId}`);
  return res.data;
};

// Audio
export const generateAudioScript = async (notebookId: string) => {
  const res = await api.post(`/notebooks/${notebookId}/audio-script`);
  return res.data;
};

export const addFileSource = async (notebookId: string, file: File) => {
  const formData = new FormData();
  formData.append("notebook_id", notebookId);
  formData.append("file", file);

  const res = await api.post("/sources/file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


// D-ID Video Generation
export const uploadSpeakerImage = async (
  notebookId: string,
  file: File
) => {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post(
    `/notebooks/${notebookId}/did/upload-image`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return res.data;
};

export const generateDIDVideo = async (
  notebookId: string,
  imageUrl: string,
  text: string
) => {
  const res = await api.post(
    `/notebooks/${notebookId}/did/generate`,
    { image_url: imageUrl, text: text }
  );
  return res.data;
};