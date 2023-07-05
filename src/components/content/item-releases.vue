<template>
  <div>
    <n-spin :show="requesting">
      <div v-if="installing">
        <n-alert title="Tips" type="info" class="px-2 mb-3">
          Currently have a task in progress. You couldn't add more tasks.
        </n-alert>
      </div>

      <n-list v-else bordered>
        <n-empty
          v-if="data.length <= 0"
          class="py-8"
          description="There is no data here."
        />

        <n-list-item v-for="item in data">
          <n-thing>
            <template #description>
              <div class="flex">
                <div class="font-bold">{{ item.name }}</div>
                <div class="text-gray-400 ml-1">#{{ item.slug }}</div>
              </div>
              <div class="mt-1">{{ item.description }}</div>
            </template>

            <n-space size="small">
              <n-button
                type="primary"
                size="small"
                @click="configureInstallOpts(item)"
              >
                <template #icon>
                  <n-icon :component="DownloadRound" />
                </template>
                Install
              </n-button>
            </n-space>
          </n-thing>
        </n-list-item>
      </n-list>
    </n-spin>

    <div class="flex justify-center mt-4">
      <n-pagination
        v-model:page="pagination.page"
        :page-count="Math.ceil((rawData.length ?? 0) / pagination.pageSize)"
        :page-slot="pagination.slot"
      />
    </div>

    <n-modal v-model:show="installingOpts.display" class="w-120">
      <n-card>
        <div class="mb-5">
          <div class="text-gray-600">Install</div>
          <div class="text-xl font-bold">{{ installingOpts.item?.name }}</div>
        </div>
        <n-input
          type="textarea"
          :value="installingOpts.path"
          :autosize="{ minRows: 3 }"
          :loading="installingOpts.choosing"
          @click="setInstallingOptsPath()"
          placeholder="Installation path of the instance"
        />
        <n-button
          class="mt-3 w-full"
          type="primary"
          :disabled="installingOpts.path.length <= 0"
          @click="install(installingOpts.item)"
        >
          <template #icon>
            <n-icon :component="DownloadRound" />
          </template>
          Go install!
        </n-button>
      </n-card>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import {
  NSpin,
  NPagination,
  NList,
  NAlert,
  NListItem,
  NThing,
  NEmpty,
  NIcon,
  NButton,
  NModal,
  NCard,
  NInput,
  NSpace,
} from "naive-ui";
import { DownloadRound } from "@vicons/material";
import { computed, reactive, ref, onMounted } from "vue";
import { http } from "../../utils/http";
import { useMessage } from "naive-ui";

const $ipc = window.require("electron").ipcRenderer;
const $message = useMessage();

const props = defineProps<{ data: any }>();

const requesting = ref(true);
const installing = ref(false);
const installingOpts = reactive<any>({
  display: false,
  choosing: false,
  path: "",
  item: {},
});

const rawData = ref<any[]>([]);
const data = computed(() => {
  const start = (pagination.page - 1) * pagination.pageSize;
  return (
    rawData.value?.reverse().slice(start, start + pagination.pageSize) ?? []
  );
});

const pagination = reactive({
  page: 1,
  pageSize: 5,
  slot: 5,
});

async function fetch() {
  try {
    requesting.value = true;
    rawData.value = (
      await http.get(`/api/explore/apps/${props.data.slug}/releases`)
    ).data;
    requesting.value = false;
  } catch (e: any) {
    $message.error(`Something went wrong... ${e}`);
  }
}

async function configureInstallOpts(data: any) {
  installingOpts.display = true;
  installingOpts.item = data;
}

function setInstallingOptsPath() {
  installingOpts.choosing = true;
  $ipc
    .invoke("utils:select-folder", "Choose folder to install")
    .then((res) => {
      installingOpts.path = res ? res[0] : installingOpts.path;
    })
    .finally(() => {
      installingOpts.choosing = false;
    });
}

async function install(data: any) {
  if (installingOpts.path && installingOpts.path.length > 0) {
    $ipc.send(
      "tasks:install-app",
      JSON.parse(JSON.stringify(installingOpts.path)),
      JSON.parse(JSON.stringify(props.data)),
      JSON.parse(JSON.stringify(data))
    );
    $message.success("Successfully added a task into the queue!")
    installingOpts.display = false
  }
}

onMounted(() => {
  fetch();
});
</script>
