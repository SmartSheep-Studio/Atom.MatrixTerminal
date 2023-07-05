<template>
  <n-config-provider :theme-overrides="themeOverrides" class="w-full h-full">
    <n-message-provider>
      <n-dialog-provider>
        <principal-provider>
          <tasks-provider>
            <library />
          </tasks-provider>
        </principal-provider>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { NConfigProvider, NMessageProvider, NDialogProvider } from "naive-ui";
import PrincipalProvider from "./components/principal-provider.vue";
import TasksProvider from "./components/tasks-provider.vue";
import Library from "./components/content/library.vue";

const themeOverrides = {
  common: {
    primaryColor: "#ca4d4dFF",
    primaryColorHover: "#DF5656FF",
    primaryColorPressed: "#C04747FF",
    primaryColorSuppl: "#A84141FF",
  },
};
</script>
