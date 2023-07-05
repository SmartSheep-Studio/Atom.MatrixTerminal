<template>
  <div>
    <n-select
      :options="instanceOptions"
      v-model:value="focusInstanceKey"
      placeholder="Select a instance to perform actions"
    />
    <n-space class="mt-3" size="small" v-if="focusInstance != null">
      <n-button type="success" size="small" @click="popups.running = true">
        <template #icon>
          <n-icon :component="PlayArrowRound" />
        </template>
        Run
      </n-button>
      <n-button type="warning" size="small" :loading="syncing" @click="update">
        <template #icon>
          <n-icon :component="CloudSyncRound" />
        </template>
        Update
      </n-button>
      <n-button type="error" size="small" @click="destroy()">
        <template #icon>
          <n-icon :component="DeleteRound" />
        </template>
        Uninstall
      </n-button>
    </n-space>

    <n-modal v-model:show="popups.running">
      <n-card title="Choose a option to run" class="w-[600px]">
        <n-space vertical>
          <n-empty
            v-if="focusInstance?.release.options.run_options.length === 0"
            description="There's no data. Contact the app's author to update this!"
          />

          <n-card v-for="item in focusInstance?.release.options.run_options">
            <div class="flex justify-between items-center">
              <div class="font-bold">{{ item.name }}</div>
              <n-button size="small" type="success" @click="run(item)">
                <template #icon>
                  <n-icon :component="PlayArrowRound" />
                </template>
                Run
              </n-button>
            </div>
          </n-card>
        </n-space>
      </n-card>
    </n-modal>
  </div>
</template>

<script lang="ts" setup>
import {
  NSelect,
  NSpace,
  NIcon,
  NButton,
  NModal,
  NCard,
  NEmpty,
  useMessage,
  useDialog,
} from "naive-ui";
import { PlayArrowRound, CloudSyncRound, DeleteRound } from "@vicons/material";
import { computed, onMounted, reactive, ref } from "vue";
import { useLibrary } from "../../stores/library";
import { http } from "../../utils/http";

const props = defineProps<{ data: any }>();

const $ipc = window.require("electron").ipcRenderer;
const $dialog = useDialog();
const $message = useMessage();
const $library = useLibrary();

const syncing = ref(false);
const popups = reactive({ running: false });

const focusInstanceKey = ref<string | null>(null);
const focusInstance = computed<any>(
  () => $library.apps.filter((v) => v.id === focusInstanceKey.value)[0]
);
const instances = computed<any[]>(
  () => $library.apps?.filter((v) => v.app.id === props.data.id) ?? []
);
const instanceOptions = computed<any[]>(() =>
  instances.value.map((v) => {
    return { label: `${v.app.name} ${v.release.name}`, value: v.id };
  })
);

async function run(item: any) {
  $ipc.send(
    "tasks:launch-app",
    JSON.parse(JSON.stringify(focusInstance.value)),
    JSON.parse(JSON.stringify(item))
  );
  popups.running = false;
  $message.success(
    "App successfully started. Maybe need sometime to load assets before the app show their screen."
  );
}

async function update() {
  try {
    syncing.value = true;

    const data = $library.apps.filter(
      (v) => v.id === focusInstanceKey.value
    )[0];
    const index = $library.apps.indexOf(data);
    const res = await http.get(`/api/explore/apps/${data.app.slug}`);

    $library.apps[index].app = res.data;
    $library.apps[index].release = res.data.releases.filter(
      (v: any) => v.id === data.release.id
    )[0];

    $library.save();
    $message.success("Sync instance configuration with cloud successfully!");
  } catch (e: any) {
    $message.error(`Something went wrong... ${e}`);
  } finally {
    syncing.value = false;
  }
}

function destroy() {
  $dialog.warning({
    title: "Warning",
    content:
      "Are you sure you wanna uninstall this app? This operation cannot undo. And this operation only delete the app index. You need delete the app files by you self.",
    positiveText: "Yes",
    negativeText: "Not really",
    onPositiveClick: () => {
      const data = $library.apps.filter(
        (v) => v.id === focusInstanceKey.value
      )[0];
      const index = $library.apps.indexOf(data);

      focusInstanceKey.value = null;

      $library.apps.splice(index, 1);
      $library.save();

      $message.success(
        "Uninstall the app successfully! But the local files isn't delete yet. You need delete them by you self."
      );
    },
  });
}

onMounted(() => {
  setTimeout(() => {
    $library.load();
  }, 100);
});
</script>
