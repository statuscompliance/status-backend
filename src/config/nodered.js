import axios from 'axios';

const nodeRedUrl = process.env.NODE_RED_URL;
const nodeRedUsername = process.env.USER_STATUS;
const nodeRedPassword = process.env.PASS_STATUS;

const nodered = axios.create({
  baseURL: nodeRedUrl,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
    withCredentials: true,
  },
  auth: {
    username: nodeRedUsername,
    password: nodeRedPassword,
  },
});

export default nodered;
