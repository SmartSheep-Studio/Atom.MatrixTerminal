<template>
  <n-spin :show="reverting">
    <div v-if="focus != null" class="w-full h-full">
      <item :data="focus" @close="focus = null" />
    </div>

    <div v-else class="w-full h-full">
      <div class="pt-10 pb-4 px-10">
        <div class="text-xl font-bold">Library</div>
        <div>Browse items you own</div>
      </div>

      <div class="px-10 py-4">
        <n-grid :cols="4" item-responsive responsive="screen" x-gap="8" y-gap="8">
          <n-gi span="2" v-for="item in library">
            <n-card class="cursor-pointer" hoverable @click="focus = apps[item.app_id]">
              <div class="text-lg">{{ apps[item.app_id]?.name }}</div>
              <div>{{ apps[item.app_id]?.description }}</div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </div>
  </n-spin>
</template>

<script lang="ts" setup>
import { NSpin, NGrid, NGi, NCard, useMessage } from "naive-ui";
import { http } from "../../utils/http";
import { onMounted } from "vue";
import { ref } from "vue";
import Item from "./item.vue";

const $message = useMessage();

const reverting = ref(true);

const library = ref<any[]>([]);
const apps = ref<{ [id: string]: any }>({});
const focus = ref<any | null>(null);

async function fetch() {
  try {
    reverting.value = true;
    library.value = (await http.get("/api/library")).data;
    for (const item of library.value) {
      if (apps.value[item.app_id] == null) {
        apps.value[item.app_id] = (await http.get(`/api/explore/apps/${item.app_id}`)).data;
      }
    }

    reverting.value = false;
  } catch (e: any) {
    $message.error(`Something went wrong... ${e}`);
  }
}

onMounted(() => {
  fetch();
});
</script>
