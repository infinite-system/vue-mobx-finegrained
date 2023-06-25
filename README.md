# vue-mobx-finegrained

Vue 3 composable for a complete MobX state management integration.
Does not require `<Observer>` to operate.`useMobX()` hooks into Vue `reactive()` object functionality directly creating a shadow object that allows seamless integration between MobX and Vue.

## Install

```sh
yarn add vue-mobx-finegrained
```

## Usage
```js
// LoginRegisterPresenter.js
import { useMobX } from 'vue-mobx-finegrained'

export class LoginRegisterPresenter {
  
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
    return useMobX(this, this.observables, { attach: 'vm' })
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

   // Instantiate the presenter
   const presenter = new LoginRegisterPresenter()
   
   // Vue shadow ViewModel(vm) reactive() object 
   const vm = presenter.vm
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
- Changing values in MobX(presenter) changes the Vue(vm) state
- Changing values in Vue(vm) state changes the MobX(presenter)
- Getters and Setters are supported
- ES6+ Maps and Sets are supported, see more instructions below*
- Functions are mirrored but use the Presenter context
- Deep changes are tracked both ways by MobX and Vue (using `deepObserve()` in MobX & `watch(..., { deep: true })` in Vue)
- MobX `deepObserve()` propagates changes to objects & arrays to Vue via atomic changes surgically editing only parts of the object rather than overwriting whole objects in this aspect it makes it superior to current Vue implementation of `watch()` (Vues' `watch()` function also runs asynchronously and does not provide atomic changes when objects change, it just gives us the new Object and old Object which are actually the same object because the comparison is done by reference, and if you want to make a diff of the changes that happened, you have to do it manually)
- *Caveat: All functions in vm are converted to async functions because they have to await for Vue values to update the Presenter before using those values, before using the inner object property values (this is because Vues' `watch()` function does not run synchronously) while MobX runs synchronously, so changing the Presenter values immediatedly reflects into the Vue (which is really good).

## Handling Maps
```js
// Don't do this, this will lose mutual reactivity of the Map between MobX & Vue
vm.mapObject = new Map([...])

// Do this instead to maintain mutual reactivity between MobX & Vue, 
// this is because (MobX converts Maps to an ObservableMap on initialization)
vm.mapObject = new ObservableMap([...])

// But, note that:
// If you are doing reassignment from the Presenter side
// then doing this is fine:
presenter.mapObject = new Map([...])
// because MobX recognizes the change and converts the Map to an ObservableMap() under the hood
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

This package has 60+ tests to verify the integration between MobX & Vue

```sh
yarn test
```
