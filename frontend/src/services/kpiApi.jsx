import axios from "axios";
import { installAuthInterceptors } from "./authClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;
installAuthInterceptors();

const kpiApi = axios.create({
  baseURL: `${API_URL}/kpi`,
  headers: { "Content-Type": "application/json" },
});

export const getKpiSummary = async () => {
  const res = await kpiApi.get("/summary");
  return res.data?.data;
};

export default kpiApi;
