import { defineStore } from "pinia";
import { useLocalStorage } from "@vueuse/core";
import { useCookies } from "@vueuse/integrations/useCookies";
import { ref } from "vue";
import { http } from "../utils/http";
import axios from "axios";

export const usePrincipal = defineStore("principal", () => {
  const isLoggedIn = ref(false);
  const cookies = useCookies(["authorization"]);
  const token = useLocalStorage<string | null>("atom-token", null, {
    serializer: {
      read(v: any) {
        if (v === "null") return null;
        else return v;
      },
      write(v: any) {
        if (v == null) return "null";
        else return v;
      },
    },
  });

  const session = ref<any>({});
  const account = useLocalStorage<any | null>("atom-profile", null, {
    deep: true,
    listenToStorageChanges: true,
    serializer: {
      read(v: any) {
        try {
          return JSON.parse(v);
        } catch {
          return null;
        }
      },
      write(v: any) {
        if (v != null) {
          return JSON.stringify(v);
        } else {
          return "null";
        }
      },
    },
  });

  function setToken(t: string) {
    token.value = t;
  }

  async function fetch() {
    if (token.value != null) {
      cookies.set("authorization", token.value);
      try {
        const res = await axios.get("https://index.smartsheep.studio/api/auth", {
          headers: { Authorization: `Bearer ${token.value}` },
        });
        account.value = res.data.user;
        session.value = res.data.session;

        http.defaults.headers["Authorization"] = `Bearer ${token.value}`;
        isLoggedIn.value = true;
      } catch {
        account.value = null;
        isLoggedIn.value = false;
      }
    }
  }

  function logout() {
    cookies.remove("authorization");
    account.value = null;
  }

  return { account, session, isLoggedIn, token, setToken, fetch, logout };
});
