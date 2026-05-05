import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Replace with your local IP when testing on a real device
const API_URL = "http://192.168.1.75:8002/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth-token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default api;
