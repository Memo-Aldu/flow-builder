import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
});


export const getAuthHeaders = (token: string) => {
  if (!token) {
    throw new Error("Token is required for authentication");
  }
  return { Authorization: `Bearer ${token}` };
};
