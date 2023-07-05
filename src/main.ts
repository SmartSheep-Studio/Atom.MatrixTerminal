import "virtual:uno.css";

import { createApp } from "vue";
import { createPinia } from "pinia";

import wrapper from "./app.vue";

import VueMarkdownEditor from "@kangc/v-md-editor";
import "@kangc/v-md-editor/lib/style/base-editor.css";
import githubTheme from "@kangc/v-md-editor/lib/theme/github.js";
import "@kangc/v-md-editor/lib/theme/style/github.css";

import Prism from "prismjs";

VueMarkdownEditor.use(githubTheme, {
  Prism,
});

import "vfonts/Lato.css";
import "vfonts/FiraCode.css";

createApp(wrapper).use(createPinia()).use(VueMarkdownEditor).mount("#app");
