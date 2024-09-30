import {
    ServiceAccountsApi,
    FoldersApi,
    DatasourcesApi,
    DashboardsApi,
    Configuration,
} from "../grafana-client/index";
import axios from "axios";

const grafanaUrl = `${process.env.GRAFANA_URL}/api/`;

export const axiosInstance = axios.create({
    baseURL: grafanaUrl,
    timeout: 3000,
    headers: {
        "Content-Type": "application/json",
    },
});
const config = new Configuration({
    username: process.env.GRAFANA_USER,
    password: process.env.GRAFANA_PASSWORD,
    apiKey: process.env.GRAFANA_API_KEY,
});
export const methods = {
    serviceAccount: new ServiceAccountsApi(config, "", axiosInstance),
    folder: new FoldersApi(config, "", axiosInstance),
    datasource: new DatasourcesApi(config, "", axiosInstance),
    dashboard: new DashboardsApi(config, "", axiosInstance),
};
