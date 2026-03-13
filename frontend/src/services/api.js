import axios from "axios";

const API = axios.create({
  baseURL: "https://ai-meeting-minutes-t1ua.onrender.com"
});

export default API;