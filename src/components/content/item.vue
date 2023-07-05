<template>
  <n-spin :show="reverting">
    <div class="w-full h-full">
      <div class="pt-8 pb-4 px-10">
        <n-page-header :title="app.name" :subtitle="app.description" @back="emits('close')">
          <template #header>
            <n-space size="small">
              <n-tag v-for="tag in app.tags" :bordered="false" type="primary">{{ tag }}</n-tag>
            </n-space>
          </template>
        </n-page-header>
      </div>

      <div class="px-10 pt-4">
        <n-grid v-if="!reverting" item-responsive responsive="screen" x-gap="8" y-gap="8">
          <n-gi span="24 m:14 l:16">
            <n-card>
              <v-md-editor :model-value="app.details" mode="preview" />
            </n-card>
            <n-card class="mt-2" title="News">
              <n-grid :cols="4" item-responsive responsive="screen" x-gap="8" y-gap="8">
                <n-gi span="4 m:2" v-for="(item, index) in app.posts">
                  <n-card class="cursor-pointer" hoverable @click="newsPopup[index] = true">
                    <div class="text-lg">{{ item.title }}</div>
                    <div>{{ item.content.substring(0, 50) }}..</div>
                  </n-card>

                  <n-modal v-model:show="newsPopup[index]">
                    <n-card content-style="padding: 0 12px" class="w-[800px]" :bordered="false" size="huge">
                      <template #header>
                        <div>{{ item.title }}</div>
                        <n-space class="mt-1" size="small">
                          <n-tag :bordered="false" type="success">
                            {{ new Date(item.created_at).toLocaleString() }}
                          </n-tag>
                          <n-tag v-for="tag in item.tags" :bordered="false" type="primary">{{ tag }}</n-tag>
                        </n-space>
                      </template>

                      <v-md-editor :model-value="item.content" mode="preview" />
                    </n-card>
                  </n-modal>
                </n-gi>
              </n-grid>
            </n-card>
          </n-gi>
          <n-gi span="24 m:10 l:8">
            <n-card title="Play">
              <n-select
                :options="instances"
                v-model:value="focusInstance"
                placeholder="Select Instance To Perform Actions"
              />
            </n-card>
            <n-card class="mt-2" title="Install">
              <item-releases :data="props.data" />
            </n-card>
            <n-card class="mt-2" title="Information">
              <div>
                <div class="font-bold">Published At</div>
                <div>{{ new Date(app.created_at).toLocaleString() }}</div>
              </div>
              <div class="mt-2">
                <div class="font-bold">Last Updated At</div>
                <div>{{ new Date(app.updated_at).toLocaleString() }}</div>
              </div>
            </n-card>
          </n-gi>
        </n-grid>
      </div>
    </div>
  </n-spin>
</template>

<script lang="ts" setup>
import { NSpin, NTag, NSpace, NSelect, NPageHeader, NModal, NGrid, NGi, NCard, useMessage } from "naive-ui";
import { computed, onMounted, ref } from "vue";
import { useLibrary } from "../../stores/library";
import { http } from "../../utils/http";
import ItemReleases from "./item-releases.vue";

const $message = useMessage();
const $library = useLibrary();

const props = defineProps<{ data: any }>();
const emits = defineEmits(["close"]);

const app = ref<any>({});
const buyable = ref(false);
const newsPopup = ref<boolean[]>([]);

const focusInstance = ref<any | null>(null);
const instances = computed<any[]>(
  () =>
    $library.library
      ?.filter((v) => v.app_id === app.value.id)
      .map((v) => {
        return { label: `${v.app.name} ${v.release.post.title}`, value: v.id };
      }) ?? []
);

const reverting = ref(true);

async function fetch() {
  try {
    reverting.value = true;
    app.value = (await http.get(`/api/explore/apps/${props.data.slug}`)).data;
    app.value.posts = (await http.get(`/api/explore/apps/${props.data.slug}/posts`)).data;
    buyable.value = (await http.get("/api/library/own", { params: { app: props.data.slug } })).status === 204;
  } catch (e: any) {
    $message.error(`Something went wrong... ${e}`);
  } finally {
    reverting.value = false;
  }
}

onMounted(() => {
  fetch();
});
</script>
