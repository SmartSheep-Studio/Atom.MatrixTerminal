import axios from "axios";

export const http = axios.create({ baseURL: "https://index.smartsheep.studio/srv/subapps/matrix" });
