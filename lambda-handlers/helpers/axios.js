const axios = require("axios").default;

/**
 * AXIOS INSTANCE USED FOR REQUESTS
 */
const SERVER_URL = "https://backend.march1st.com/rpbackend";
const instance = axios.create({
  baseURL: SERVER_URL,
  method: "POST",
  timeout: 1000,
  headers: {
    "Content-Type": "application/json",
  },
});

exports.instance = instance;
