import { Container } from 'inversify'
import { MessagesRepository } from './Core/Messages/MessagesRepository'
import { Router } from './Routing/Router'
import { RouterRepository } from './Routing/RouterRepository'
import { UserModel } from './Authentication/UserModel'
import { NavigationRepository } from './Navigation/NavigationRepository'
import { AppPresenter } from './AppPresenter'
import { TestPresenter } from "./Authentication/TestPresenter.js";
import { TestVue } from "./Authentication/TestVue.js";
import { TestVue2 } from "./Authentication/TestVue2.js";
import { markRaw, reactive, shallowReactive, shallowRef, computed, effectScope } from "vue";
import { getAllProperties, getMagicProperties, isObservableMapOrSet } from "@/utils.js";
import { action, extendObservable, observable, reaction, runInAction } from "mobx";
import { AuthenticationRepository } from "@/tests/Helpers/Authentication/AuthenticationRepository.js";
import { tryOnScopeDispose } from "@vueuse/core";
import { container } from './container.ts'


function beforeAction (fn, args) {
  console.log('after', fn, args)
}

function afterAction (fn, args, result) {
  console.log('after', fn, args, result)
  if (!fn?.__afterEffect__){
    fn.__afterEffect__ = []
  }
  // fn.__afterEffect__ =
}

function mobXtoVue (ctx, obj) {


  const props = getAllProperties(obj)
  const magicProps = getMagicProperties(obj)
  const hasOverrides = 'overrides' in obj
  const overrides = 'overrides' in obj ? obj.overrides : {}

  const vue = reactive(Object.create(obj))

  for (let i = 0; i < props.length; i++) {
    const prop = props[i]
    if (prop === 'constructor') continue
    if (prop in magicProps.get) continue

    vue[prop] = typeof obj[prop] === 'function'
      ? function (...args) {
        const savedArgs = [...args]
        beforeAction(obj[prop], savedArgs)
        const savedResult = obj[prop].bind(vue)(...args)
        afterAction(obj[prop], savedArgs, savedResult)
        return savedResult
      }
      : (overrides?.[prop] === false ? markRaw(obj[prop]) : obj[prop])
  }

  if (hasOverrides) {
    obj.overrides = markRaw(obj.overrides)
  }

  const computeds = {}
  const scope = {}

  for (const prop in magicProps.get) {

    if (overrides?.[prop] === false) continue

    const descriptors = Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop)

    computeds[prop] = null

    Object.defineProperty(vue, prop, {
      get: function () {
        if (computeds[prop]) {
          return computeds[prop].value
        }
        else {
          scope[prop] = effectScope()
          scope[prop].run(() => {
            computeds[prop] = computed(() => {
              return descriptors.get.bind(vue)()
            })
          })
          tryOnScopeDispose(() => {
            scope[prop].stop()
          })
          return computeds[prop]
        }
      },
      set: descriptors.set?.bind(vue),
      enumerable: descriptors.enumerable,
      configurable: descriptors.configurable
    })

  }


  if ('setup' in vue && typeof vue?.setup === 'function') {
    const setupScope = effectScope()

    setupScope.run(() => {
      vue?.setup()
    })

    tryOnScopeDispose(() => {
      setupScope.stop()
    })
  }

  return vue
}


function mobXtoVueOld (ctx, obj) {

  const props = getAllProperties(obj)
  const magicProps = getMagicProperties(obj)
  const hasOverrides = 'overrides' in obj

  let vue = {}
  let getters = []

  for (let i = 0; i < props.length; i++) {

    const prop = props[i]
    if (prop === 'constructor') continue

    if (typeof magicProps.get[prop] !== 'undefined') {
      getters.push(prop)
      continue
    }

    vue[prop] = typeof obj[prop] === 'function'
      ? obj[prop].bind(vue)
      : (
        hasOverrides && prop in obj.overrides && obj.overrides[prop] === observable.shallow
          ? markRaw(obj[prop])
          : obj[prop]
      )
  }

  if (hasOverrides) {
    obj.overrides = markRaw(obj.overrides)
    obj.overrides['overrides'] = false
  }

  vue = reactive(vue)

  extendObservable(vue, vue, obj.overrides)
  // console.log('vue', vue, 'overrides', obj.overrides)

  for (let i = 0; i < getters.length; i++) {

    const prop = getters[i]
    // console.log('Object.getOwnPropertyDescriptor(obj, prop)', prop, Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop))

    if (hasOverrides && prop in obj.overrides && obj.overrides[prop] === false)
      continue

    const descriptors = Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop)

    Object.defineProperty(vue, prop, {
      get: descriptors.get.bind(vue),
      set: descriptors.set?.bind(vue),
      enumerable: descriptors.enumerable,
      configurable: descriptors.configurable
    })

    const computedHandler = newValue => {
      vue[`${prop.substring(1)}`] = newValue
    }

    const computedObserveDisposer = reaction(() => {
      // console.log('init computed', prop, vue[prop])
      return vue[prop]
    }, computedHandler)

    tryOnScopeDispose(() => {
      computedObserveDisposer()
    })

  }

  return vue;
}


export class BaseIOC {
  container

  constructor () {
    this.container = container
  }

  buildBaseTemplate = () => {

    this.container.bind(MessagesRepository).to(MessagesRepository).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(Router).to(Router).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(RouterRepository).to(RouterRepository).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(NavigationRepository).to(NavigationRepository).inSingletonScope()
    this.container.bind(UserModel).to(UserModel).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(AppPresenter).to(AppPresenter).inSingletonScope()
    this.container.bind(TestPresenter).to(TestPresenter).inSingletonScope()
    this.container.bind(TestVue).to(TestVue).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(TestVue2).to(TestVue2).inSingletonScope().onActivation(mobXtoVue);
    this.container.bind(AuthenticationRepository).to(AuthenticationRepository).inSingletonScope().onActivation(mobXtoVue);

    return this.container
  }
}
