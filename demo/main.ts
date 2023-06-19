import { createApp } from "vue";
import { useMobX } from "../src/useMobX.ts";
import App from "./App.vue";

const app = createApp(App);

app.mount("#app");
