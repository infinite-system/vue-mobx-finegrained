# vue-mobx-finegrained

Vue 3 composable for a complete MobX state management integration.
Does not require `<Observer>` to operate.`useMobX()` hooks into Vue `reactive()` object functionality directly creating a shadow object that allows seamless integration between MobX and Vue.

## Install

```sh
yarn add vue-mobx-finegrained
```

## Usage
```js
class LoginRegisterPresenter {
  
  email = null
  password = null
  option = null


  observables = {
    email: observable,
    password: observable,
    option: observable,
    _awesome: observable,
    awesome: computed,
    reset: action,
    login: action,
    register: action,
    logOut: action
  }
  

  constructor () {
    makeObservable(this, this.observables)
  }
    
  get vm () {
    return useMobX(this, this.observables)
  }

  async login () {}

  async register () {}

  _awesome = {}

  get awesome () {
    return this._awesome
  }

  set awesome (value) {
    this._awesome = value
  }

  reset () {
    this.email = ''
    this.password = ''
    this.option = 'login'
  }

}

```

### In your component:

```html
<script setup>
   import { LoginRegisterPresenter } from "./LoginRegisterPresenter.js";

   const vm = new LoginRegisterPresenter().vm;
</script>

<template>
   <!-- All the variables are reactive without <Observer> -->
   Email: <input type="text" v-model="vm.email" /><br />
   Password: <input type="text" v-model="vm.email" /><br />
   Option: <input type="text" v-model="vm.option" /><br />
   Awesome: <input type="text" v-model="vm.awesome" /><br />
   <!-- All functions are also available -->
   <button @click="vm.login()">Login</button>
</template>
```

## Features
- Changing values in Presenter (changes the Vue(vm) state)
- Changing values in Vue(vm) state, changes the Presenter
- Getters and setters are supported
- Functions are mirrored but use the Presenter context
- *Caveat: All functions in vm are converted to async to await for Vue values to update the Presenter, before using the values (this is because Vues' `watch()` function does not run synchronously)
- MobX runs synchronously, so changing the Presenter values, immediatedly reflects into the Vue
- Deep changes are tracked both ways by MobX and Vue (using `deepObserve()`in MobX & `watch(..., { deep: true })` in Vue)

### Run Unit Tests with [Vitest](https://vitest.dev/)

This package has 60+ tests to verify the integration between MobX & Vue

```sh
yarn test
```
