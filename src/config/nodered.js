import axios from 'axios';

const nodeRedUrl = process.env.NODE_RED_URL;

const nodered = axios.create({
  baseURL: nodeRedUrl,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default nodered;
