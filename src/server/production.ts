import { createApi } from "./api";
import { getDatabase } from "./database";
import { createStore } from "./store";

export const api = createApi({
  getStore: () => createStore(getDatabase()),
  production: process.env.NODE_ENV === "production",
  appOrigin: () => process.env.APP_ORIGIN,
});
