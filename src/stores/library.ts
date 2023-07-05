import { useLocalStorage } from "@vueuse/core";
import { defineStore } from "pinia";

export const useLibrary = defineStore("library", () => {
  const library = useLocalStorage<any[]>("app-library", [], {
    serializer: {
      read(v: any) {
        if (v === "null") return null;
        else return JSON.parse(v);
      },
      write(v: any) {
        if (v == null) return "null";
        else return JSON.stringify(v);
      },
    },
  });

  return { library };
});
