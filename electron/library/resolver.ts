import Store from "electron-store";

export const store = new Store({
    defaults: {
        version: "1.0.0"
    }
});