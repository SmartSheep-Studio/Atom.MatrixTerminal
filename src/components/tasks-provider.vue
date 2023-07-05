<template>
  <div class="w-full h-full">
    <slot />

    <div class="fixed bottom-[24px] right-[24px]">
      <n-button
        circle
        size="large"
        type="primary"
        class="trigger-button inline-block flex"
        @click="displaying = true"
        v-if="processList.length > 0"
      >
        <template #icon>
          <n-icon :component="DownloadRound" />
        </template>
      </n-button>
    </div>

    <n-modal v-model:show="displaying" class="w-[75vw]">
      <n-card title="Tasks">
        <n-card title="Processing">
          <n-list bordered>
            <n-list-item v-if="processList.length == 0">
              <n-empty description="No tasks need to process." />
            </n-list-item>
            <n-list-item v-for="item in processList">
              <n-thing>
                <div>
                  <div class="font-bold">{{ item.name }}</div>
                  <div>{{ item.description }}</div>
                  <n-progress
                    class="mt-1"
                    :height="4"
                    type="line"
                    :percentage="item.progress"
                    :show-indicator="false"
                  />
                  <div class="mt-1 text-gray-500 font-mono text-[12px]">
                    <span>{{ item.progress_step }}</span> |
                    <span>{{
                      item.progress_details ?? "100,000,000 years"
                    }}</span>
                    |
                    <span>{{ item.progress }}%</span>
                  </div>
                </div>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>

        <n-card class="mt-2" title="Finished">
          <n-list bordered>
            <n-list-item v-if="finishList.length == 0">
              <n-empty description="No completed tasks." />
            </n-list-item>
            <n-list-item v-for="item in finishList">
              <n-thing>
                <div>
                  <div class="font-bold">{{ item.name }}</div>
                  <div>{{ item.description }}</div>
                  <n-progress
                    class="mt-1"
                    :height="4"
                    status="success"
                    type="line"
                    :percentage="item.progress"
                    :show-indicator="false"
                  />
                  <div class="mt-1 text-gray-500 font-mono text-[12px]">
                    <span>{{ item.progress_step }}</span> |
                    <span>{{
                      item.progress_details ?? "100,000,000 years"
                    }}</span>
                    |
                    <span>{{ item.progress }}%</span>
                  </div>
                </div>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-card>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import {
  NButton,
  NIcon,
  NModal,
  NCard,
  NList,
  NListItem,
  NProgress,
  NEmpty,
} from "naive-ui";
import { DownloadRound } from "@vicons/material";
import { computed, onMounted, ref } from "vue";

const $ipc = window.require("electron").ipcRenderer;

const displaying = ref(false);

const tasks = ref<{ [id: string]: any }>([]);
const taskList = computed(() => Object.values(tasks.value));
const finishList = computed(() => taskList.value.filter((v) => v.is_finished));
const processList = computed(() =>
  taskList.value.filter((v) => !v.is_finished)
);

async function initHooks() {
  tasks.value = await $ipc.invoke("tasks:list");

  $ipc.on("tasks:update", (_event, id: string, data: any) => {
    tasks.value[id] = data;
  });

  console.log("tasks: ", tasks.value);
}

onMounted(() => {
  initHooks();
});
</script>

<style scoped>
.trigger-button {
  box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
}
</style>
