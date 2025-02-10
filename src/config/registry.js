import axios from 'axios';

const registryUrl = process.env.REGISTRY_URL;

const registry = axios.create({
  baseURL: registryUrl,
  timeout: 3000,
  headers: {
    'Content-Type': 'application/json',
    withCredentials: true,
  }
});

export default registry;
