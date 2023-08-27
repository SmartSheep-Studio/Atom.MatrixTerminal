<template>
  <div class="h-full w-full">
    <div v-if="isReady" class="ready-content">
      <slot></slot>
    </div>

    <div v-else class="unready-content w-full h-full flex justify-center items-center">
      <div>
        <div class="text-center">
          <img src="../assets/icon.png" width="64" height="64" />
          <div class="text-gray-600">Sign in</div>
          <div class="text-2xl font-bold">MatrixTerminal</div>
        </div>
        <div class="w-96 mt-5">
          <n-spin :show="reverting">
            <n-card>
              <n-form ref="form" :rules="rules" :model="payload" @submit.prevent="submit">
                <n-form-item label="Username" path="id">
                  <n-input v-model:value="payload.id" placeholder="Also accept email address" />
                </n-form-item>
                <n-form-item label="Password" path="password">
                  <n-input v-model:value="payload.password" type="password" placeholder="Accept anything you want" />
                </n-form-item>

                <n-button class="w-full" type="primary" attr-type="submit" :loading="submitting">Sign in</n-button>

                <div class="mt-4 flex justify-center items-center text-xs text-center text-gray-400">
                  <span>Powered By Atom ID</span>
                  <n-icon :component="LockOpenFilled" size="16" class="ml-1" />
                </div>
              </n-form>
            </n-card>
          </n-spin>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  NSpin,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NIcon,
  NButton,
  type FormRules,
  type FormInst,
  useMessage,
} from "naive-ui";
import { onMounted, reactive, ref } from "vue";
import { LockOpenFilled } from "@vicons/material";
import { usePrincipal } from "../stores/principal";
import axios from "axios";

const $principal = usePrincipal();
const $message = useMessage();

const isReady = ref(false);

const form = ref<FormInst | null>(null);
const reverting = ref(true);
const submitting = ref(false);

const rules: FormRules = {
  id: {
    required: true,
    message: "Need least one character",
    trigger: ["blur", "input"],
  },
  password: {
    required: true,
    validator: (_, v) => v.length >= 6,
    message: "Need least six characters",
    trigger: ["blur", "input"],
  },
};

const payload = reactive({
  id: "",
  password: "",
});

async function submit() {
  const client_id = "matrix2terminal";
  const client_secret = `b/Q$j''*2$Y9"NF+TPdXl\`U/=;Pw>|`;

  try {
    submitting.value = true;
    const res = await axios.post("https://index.smartsheep.studio/api/auth/openid/exchange", {
      client_id,
      client_secret,
      grant_type: "password",
      username: payload.id,
      password: payload.password,
      scope: "*",
    });

    $principal.setToken(res.data.access_token);
    await $principal.fetch();

    isReady.value = $principal.isLoggedIn;

    $message.success(`Welcome back, ${$principal.account?.nickname}!`);
  } catch (e: any) {
    if (e.response.status === 401) {
      $message.error("Invalid username or password.");
    } else {
      $message.error(`Something went wrong... ${e}`);
    }
  } finally {
    submitting.value = false;
  }
}

onMounted(async () => {
  reverting.value = true;
  await $principal.fetch();
  isReady.value = $principal.isLoggedIn;
  reverting.value = false;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
