<script setup lang="ts">
import { LoginRegisterPresenter } from '../Authentication/LoginRegisterPresenter'
import { container } from '../AppIOC'
const presenter = container.get(LoginRegisterPresenter)
</script>
<template>
    <div @click="() => presenter.logOut()"
      class="navigation-item"
      :style="{ backgroundColor: '#5BCA06' }"
    >
      <span>☯ Logout</span>
    </div>
</template>
