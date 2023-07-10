<script setup lang="ts">
import { TestPresenter } from './TestPresenter.js'
import { container } from '../AppIOC'
const presenter = container.get(TestPresenter)
</script>
<template>
    <div @click="() => presenter.logOut()"
      class="navigation-item"
      :style="{ backgroundColor: '#5BCA06' }"
    >
      <span>☯ Logout</span>
    </div>
</template>
