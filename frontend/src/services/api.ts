import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  emailVerified: boolean;
  provider?: string;
}
