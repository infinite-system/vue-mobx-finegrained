import { Container } from 'inversify'
import { MessagesRepository } from './Core/Messages/MessagesRepository'
import { Router } from './Routing/Router'
import { RouterRepository } from './Routing/RouterRepository'
import { UserModel } from './Authentication/UserModel'
import { NavigationRepository } from './Navigation/NavigationRepository'
import { AppPresenter } from './AppPresenter'
import { TestPresenter } from "./Authentication/TestPresenter.js";
import { TestVue } from "./Authentication/TestVue.js";
import { markRaw, reactive, shallowReactive } from "vue";
import { getAllProperties, getMagicProps, isObservableMapOrSet } from "@/utils.js";
import { action, computed, extendObservable, observable, reaction, runInAction } from "mobx";

function mobXtoVue (ctx, obj) {

  const props = getAllProperties(obj)
  const magicProps = getMagicProps(obj)
  const hasOverrides = 'overrides' in obj

  const vue = reactive({})

  for (let i = 0; i < props.length; i++) {

    const prop = props[i]

    if (prop === 'constructor') continue
    if (typeof magicProps.get[prop] !== 'undefined') continue

    vue[prop] = typeof obj[prop] === 'function'
      ? obj[prop].bind(vue)
      : (hasOverrides && prop in obj.overrides && obj.overrides[prop] === false ? markRaw(obj[prop]) : obj[prop])
  }

  if (hasOverrides) {
    obj.overrides = markRaw(obj.overrides)
    obj.overrides['overrides'] = false
  }

  extendObservable(vue, vue, obj.overrides)
  // console.log('vue', vue, 'properties', properties, 'overrides', obj.overrides)

  for (let i = 0; i < props.length; i++) {

    const prop = props[i]

    if (prop === 'constructor') continue

    if (typeof magicProps.get[prop] !== 'undefined') {

      // console.log('Object.getOwnPropertyDescriptor(obj, prop)', prop, Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop))

      Object.defineProperty(vue, prop, {
        get: Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop).get.bind(vue),
        set: Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop).set?.bind(vue),
        enumerable: Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop).enumerable,
        configurable: Object.getOwnPropertyDescriptor(obj.constructor.prototype, prop).configurable
      })

      const computedHandler = newValue => {
        vue[`_${prop}`] = newValue
      }

      const computedObserveDisposer = reaction(() => {
        // console.log('init computed', prop, vue[prop])
        return vue[prop]
      }, computedHandler)
    }
  }

  return vue;
}

export class BaseIOC {
  container

  constructor () {
    this.container = new Container({
      autoBindInjectable: true,
      defaultScope: 'Transient',
    })
  }

  buildBaseTemplate = () => {

    this.container.bind(MessagesRepository).to(MessagesRepository).inSingletonScope()
    this.container.bind(Router).to(Router).inSingletonScope()
    this.container.bind(RouterRepository).to(RouterRepository).inSingletonScope()
    this.container.bind(NavigationRepository).to(NavigationRepository).inSingletonScope()
    this.container.bind(UserModel).to(UserModel).inSingletonScope()
    this.container.bind(AppPresenter).to(AppPresenter).inSingletonScope()
    this.container.bind(TestPresenter).to(TestPresenter).inSingletonScope()
    this.container.bind(TestVue).to(TestVue).inSingletonScope().onActivation(mobXtoVue);

    return this.container
  }
}
