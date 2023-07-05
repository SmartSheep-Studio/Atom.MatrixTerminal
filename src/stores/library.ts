import { store } from "../../electron/library/resolver";
import { defineStore } from "pinia";
import { ref } from "vue";

export const useLibrary = defineStore("library", () => {
  const apps = ref<any[]>([])

  function load() {
    apps.value = store.get("library.apps")
  }

  function save() {
    store.set("library.apps", apps.value)
  }

  return { apps, load, save };
});
