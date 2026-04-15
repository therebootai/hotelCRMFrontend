import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
  const isLoginRequest = error.config?.url?.includes("/login");
  const isMeEndpoint = error.config?.url?.includes("/users/me");

    if (error?.response?.status === 401 && !isLoginRequest && !isMeEndpoint) {
      try {
        await axios.post(
          `${api.defaults.baseURL}/api/v1/users/logout`,
          {},
          { withCredentials: true },
        );
      } catch (e) {
        console.error("Logout request failed:", e);
      }

      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default api;
