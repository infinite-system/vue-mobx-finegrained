<script setup lang="ts">
import { reactive, ref } from 'vue'
import { container } from '@/tests/Helpers/AppIOC'
import { LoginRegisterPresenterAuto } from "../src/tests/Helpers/Authentication/LoginRegisterPresenterAuto.js";
import { LoginRegisterPresenter } from "../src/tests/Helpers/Authentication/LoginRegisterPresenter.js";
 const w = window
 const test = reactive({ 'test': 'test' })
 const test2 = { 'test': ref({test: 'test'}), 'array':['test','test2'] }
import cloneDeep from 'lodash/cloneDeep.js'
const presenter = container.get(LoginRegisterPresenter)
const presenter2 = container.get(LoginRegisterPresenterAuto)

const vm:LoginRegisterPresenter = presenter.vm
const vm2:LoginRegisterPresenterAuto = presenter2.vm

// console.log(vm.derivedState)
setTimeout(() => {
  console.log(presenter.hugeArray[20].struct.user)

  presenter2.testNonObservable = 444
  console.log('vm.testNonObservable', vm2.testNonObservable)

  presenter._hugeArray[20].struct.user = 1
  presenter._hugeArray.push({test:'hola'})
  // alert(presenter.hugeArray[22].test)
},500)

setInterval(() => {

  presenter._hugeArray.push({test:'hola'})
}, 1000)

// const hugeObject = reactive(cloneDeep(vm.hugeArray))
console.log('vm', vm)
let i = 1
// setTimeout(() => presenter.mapObjectVisual.set(i++, 'test'), 1000)
// setTimeout(() => presenter.setObjectVisual.add('test'), 1000)

vm.shallowObj.test = 1
</script>
<template>

<!--  <vue-dd v-model="vm.mapObjectVisual" />-->
  <div v-for="[key, value] in vm.mapObjectVisual">
    {{ key }} => {{ value }};
  </div>

  <button @click="vm.mapObjectVisual.set(1, 'testa')">Set Map</button><br />
  <button @click="vm.mapObjectVisual.delete(1)">Delete from Map</button><br />
  <button @click="vm.mapObjectVisual = new Map([['test',true]])">Reassign Map</button><br />
  <br />
<!--  <vue-dd v-model="vm.setObjectVisual" />-->

  <div v-for="viewSet in vm.setObjectVisual">
    {{ viewSet }}
  </div>
  <button @click="vm.setObjectVisual.add(3)">Add to Set</button><br />
  <button @click="vm.setObjectVisual.delete(3)">Delete from Set</button><br />
  <button @click="vm.setObjectVisual = new Set(['hello'])">Reassign Set</button><br />
  <h1>vue-mobx-finegrained tests</h1>

<!--  <vue-dd name="window" :get-all-properties="false" v-model="w" />-->
<!--  <br />-->
<!--  <vue-dd name="test" :get-all-properties="true" v-model="test" />-->
<!--  <br />-->
<!--  <vue-dd name="test2" :get-all-properties="true" v-model="test2" />-->
<!--  <br />-->
<!--  <vue-dd name="presenter" :get-all-properties="true" v-model="presenter" />-->

<!--  <vue-dd name="vm" :get-all-properties="true" v-model="presenter.vm" />-->
  <br />
<!--  <vue-dd name="vm2" :get-all-properties="true" v-model="vm2" />-->
<!--  <vue-dd name="presenter.hugeArray" :get-all-properties="true" v-model="presenter.hugeArray[20]" />-->
<br />


  {{ vm.parentGetter }}
  <button @click="vm.parentGetter = 100">Set parent getter directly to 100 (should make error)</button><br />
  <button @click="() => vm._parentGetter = 200">Set parent getter inner value to 200  (should not make error)</button><br />
  <button @click="presenter._parentGetter = 200">Set presenter _parentGetter inner value to 200  (should not make error)</button><br /><br />

  <br />
  {{ vm.email }}<br />
<input type="text" v-model="vm.email" /><br />
  vm.hugeArray<br />
  {{vm.hugeArray[20].struct.user}}<br />
<input type="text" v-model="vm.hugeArray[20].struct.user" /><button @click="vm.alertState()">Alert state</button><br />
<!-- derived state: {{vm.derivedState[100].struct.user}}<br />-->
<!--<input type="text" v-model="vm.derivedState[100].struct.user" /><button @click="vm.alertState()">Alert state</button><br />-->
<!--  hugeArray<br />-->
<!--  {{hugeObject[100].struct.user}} <br />-->
<!--<input type="text" v-model="hugeObject[100].struct.user" />-->

  <!--  <Observer>-->watch
  <div v-for="element in vm.viewTest">
    <input type="text" /><input type="text" v-model="element.test1" /> {{ element.sub.test }}
  </div>

  <button @click="() => { vm.viewTest = [{ test1: 'hola', sub:{test:11} }] }">Set value</button><br />

  <button @click="() => { vm.setAuthRepoTest() }">Set value push</button><br />
  <button @click="() => { vm.setAuthRepoArrayKey() }">Set array key & notify</button> <br />
  <button @click="() => { vm.setInjectableObservableSubProperties() }">Set injectable authenticationRepository object properties</button><br />
  {{ vm.awesome.a.b.c }}


<!--  {{ vm.viewTest?.[0]?.sub?.test }}-->
<!--  <vue-dd v-model="vm.awesome" />-->
  <button @click="() => { vm.awesome.a.b.c = 1 }">Set _awesome</button><br />
  <button @click="() => { vm.viewTest[0].sub.test = 'haha' }">Set value sub test</button><br />
  <button @click="() => { vm.setObjectSubProperty() }">Set password object sub property</button><br />
  <button @click="() => { vm.setSpliceArrayProperty() }">Set password splice array prop</button><br />
  <button @click="() => { vm.setPushArrayItem() }">Set password push array value</button><br />
  <button @click="() => { presenter.email = 'eka@eka.ca' }">Set presenter email</button><br />
  <button @click="() => { vm.setViewTestViaMethod() }">Set viewTest via a method</button><br />
  <button @click="() => { vm.setPushSubObjectArrayItem() }">Set password setPushSubObjectArrayItem</button><br />
  <button @click="() => { vm.addObjectSubProperty() }">Set password addObjectSubProperty</button><br />
  <button @click="() => { vm.addObjectProperty() }">Set password addObjectProperty</button><br />
  <button @click="() => { vm.deleteSubObjectProperty() }">Delete password deleteSubObjectProperty</button><br />
  <button @click="() => { vm.setSubProperty() }">Set password setSubProperty</button><br />
  <button @click="() => { vm.setProperty() }">Set password setProperty</button><br />
<!--{{vm.password}}-->
<!--  <div v-for="(data, index) in vm.password" :key="index">-->
<!--    {{ data }}-->
<!--  </div>-->
<!--  <div v-if="vm.password[5]">-->
<!--    {{vm.password[5]}}-->
<!--  </div>-->
</template>

<style>
.rendererParent {
  width: 100%;
  height: 580px;
  border: 1px solid black;
}
</style>
