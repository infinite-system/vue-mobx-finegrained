import 'reflect-metadata'
import { createApp } from "vue";
import { useMobX } from "../src/useMobX.ts";
import App from "./App.vue";
import { VueDd } from 'vue-dd'
import { container } from '@/tests/Helpers/AppIOC'
import { configure } from 'mobx'
const app = createApp(App);

configure({
  enforceActions: 'never',
  safeDescriptors: false,
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false,
})
app.component('VueDd', VueDd)
app.mount("#app");
