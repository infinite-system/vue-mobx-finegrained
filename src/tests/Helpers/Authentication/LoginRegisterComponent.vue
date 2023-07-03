<script setup lang="ts">
// import { Observer, useLocalObservable } from 'mobx-vue-lite'
import { reaction } from 'mobx'
import { LoginRegisterPresenter } from '@/tests/Helpers/Authentication/LoginRegisterPresenter'
import MessagesComponent from '@/tests/Helpers/Core/Messages/MessagesComponent.vue'
// import { useValidation } from '../Core/Providers/Validation'
import { container } from '../AppIOC'
import { AuthenticationRepository } from "@/tests/Helpers/Authentication/AuthenticationRepository.js";
import { reactive } from "vue";


const presenter: LoginRegisterPresenter = container.get(LoginRegisterPresenter);
const vm: LoginRegisterPresenter = presenter.vm

console.log('presenter', presenter)
console.log('vm', vm)
// const vm: LoginRegisterPresenter = presenter.getVm();
// console.log('vm', vm)
const auth = container.get(AuthenticationRepository);
// let i = 0
// setInterval(() => {
//   vm.awesome = i++
// }, 500)
// vm.awesome = 'test'
console.log(' vm.password',  vm.password)
// setInterval(() => vm.password.push('aaa'), 1000);
const a = reactive(['test','test2'])
console.log('a', a)
// setInterval(() => a.push('aaa'), 1000);
setTimeout(() => presenter.addObjectProperty(), 1000);


const props = Object.getOwnPropertyNames(LoginRegisterPresenter)
  .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(LoginRegisterPresenter)));


const proto = Object.getPrototypeOf(presenter)

const arr =    (proto && proto.constructor.name !== 'Object'
    ? Object.getOwnPropertyNames(proto) : []
).concat(Object.getOwnPropertyNames(presenter))

</script>
<template>
{{ arr }}
  <vue-dd name="LoginRegisterPresenter" :get-all-properties="true" v-model="props" />
  <vue-dd name="presenter" :get-all-properties="true" v-model="presenter" />
  <vue-dd name="vm" :get-all-properties="true" v-model="vm" />
<!--  <vue-dd name="a" v-model="a" />-->

  <div class="container">
    <div class="login-register">
      <div class="w3-row">
        <div class="w3-col s4 w3-center">
          <br />
        </div>
        <div class="w3-col s4 w3-center logo">
          <img alt="logo"
               src="https://kajabi-storefronts-production.kajabi-cdn.com/kajabi-storefronts-production/themes/2147767979/settings_images/iE7LayVvSHeoYcZWO4Dq_web-logo-pink-light-bg3x.png"
               style="width: 160px; filter: grayscale(100%);">
        </div>

        <div class="w3-col s4 w3-center">

        </div>
      </div>
    </div>

    <!--  <Observer>-->
    <div v-for="element in vm.viewTest">
      <input type="text" v-model="element.test1" /> {{ element.sub.test }}
    </div>
    <!--  </Observer>-->

<!--    <Observer2 :state="vm">-->
<!--      <input type="hidden" :value="vm" />-->
<!--      <input type="text" v-model="presenter.password.test.rest" />-->
<!--      {{ presenter.password.test.rest}}-->
<!--    </Observer2>-->

<!--{{vm.password.test.rest}}-->
<!--    <Observer>-->
<!--      <div v-for="element in presenter.viewTest">-->
<!--        <input type="text" v-model="element.test1" /> {{ element.sub.test }}-->
<!--      </div>-->
<!--    </Observer>-->

    <button @click="() => { vm.viewTest = [{ test1: 'hola', sub:{test:11} }] }">Set value</button>

    <button @click="() => { vm.setAuthRepoTest() }">Set value push</button>
    <button @click="() => { vm.setAuthRepoArrayKey() }">Set array key & notify</button> <br />
    <button @click="() => { vm.setInjectableObservableSubProperties() }">Set injectable authenticationRepository object properties</button>
    <button @click="() => { vm.viewTest[0].sub.test = 1 }">Set value sub test</button>
    <button @click="() => { vm.setObjectSubProperty() }">Set password object sub property</button>
    <button @click="() => { vm.setSpliceArrayProperty() }">Set password splice array prop</button>
    <button @click="() => { vm.setPushArrayItem() }">Set password push array value</button>
    <button @click="() => { presenter.email = 'eka@eka.ca' }">Set presenter email</button>
    <button @click="() => { vm.setViewTestViaMethod() }">Set viewTest via a method</button>
    <button @click="() => { vm.setPushSubObjectArrayItem() }">Set password setPushSubObjectArrayItem</button>
    <button @click="() => { vm.addObjectSubProperty() }">Set password addObjectSubProperty</button>
    <button @click="() => { vm.addObjectProperty() }">Set password addObjectProperty</button>
    <button @click="() => { vm.deleteSubObjectProperty() }">Delete password deleteSubObjectProperty</button>
    <button @click="() => { vm.setSubProperty() }">Set password setSubProperty</button>
    <button @click="() => { vm.setProperty() }">Set password setProperty</button>

   <div v-for="(data, index) in vm.password" :key="index">
     {{ data }}
   </div>
    <div v-if="vm.password[5]">
      {{vm.password[5]}}
    </div>
    <br />
    <br />
    <button @click="() => { presenter.email = 'test' }">Set Presenter email</button>

    <div>
      <div class="w3-row">
        <div class="w3-col s4 w3-center">
          <br />
        </div>
        <div class="w3-col s4 w3-center option">
          <input
            class="lr-submit"
            :style="{ backgroundColor: '#e4257d' }"
            type="submit"
            value="login"
            @click.prevent="() => vm.option = 'login'"
          />
          <input
            class="lr-submit"
            :style="{ backgroundColor: '#2E91FC' }"
            type="submit"
            value="register"
            @click.prevent="() => {
              vm.option = 'register'
            }"
          />
        </div>
        <div class="w3-col s4 w3-center">
          <br />
        </div>
      </div>
      <div
        class="w3-row"
        :style="{
        backgroundColor: vm.option === 'login' ? '#E4257D' : '#2E91FC',
        height: '100px',
        paddingTop: '20px',
      }"
      >
        <form
          class="login"
          @submit.prevent="(event) => {
          // event.preventDefault()
          if (vm.formValid()) {
            if (vm.option === 'login') vm.login()
            if (vm.option === 'register') vm.register()
          }
        }"
        >
          <div class="w3-col s4 w3-center">
            <input
              type="text"
              v-model="vm.email"
              placeholder="Email"
            />
          </div>
          <div class="w3-col s4 w3-center">
            <input
              type="text"
              v-model="vm.password"
              placeholder="Password"
            />
          </div>
          <div class="w3-col s4 w3-center">
            <input type="submit" class="lr-submit" :value="vm.option" />
          </div>

          <br />
        </form>
      </div>
      <MessagesComponent />
    </div>
  </div>
</template>
