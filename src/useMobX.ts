import { reactive, watch, UnwrapNestedRefs, toRaw, shallowRef, shallowReactive, markRaw, ref } from "vue";
import { tryOnScopeDispose } from '@vueuse/core'
import { reaction, ObservableMap, ObservableSet, observable, observe } from 'mobx'
import { deepObserve } from "mobx-utils";

import get from 'lodash/get'
import cloneDeep from 'lodash/cloneDeep'
import clone from 'lodash/clone'

/**
 * Notify MobX reactivity system of changes to propagate Vue reactive changes, by reassigning values.
 *
 * @param obj
 */
export function notify (obj) {
  return clone(obj)
}

/**
 * Get setters and getters of a class instance.
 * Also gets all magic methods (getters and setters) stored in 'all' param.
 *
 * @param instance
 * @return { get: [...], set: [...], all: [...] }
 */
function getMagicProps (instance) {

  let proto = Object.getPrototypeOf(instance)

  let props = []
  while (proto && proto.constructor.name !== 'Object') {
    props.push.apply(props, Object.entries(
      Object.getOwnPropertyDescriptors(proto)
    ))
    proto = Object.getPrototypeOf(proto.constructor.prototype)
  }

  const magicProps = { get: {}, set: {}, all: {} }

  for (let i = 0; i < props.length; i++) {
    if (props[i][0] !== '__proto__') {
      if (typeof props[i][1].get === 'function') {
        // getters
        magicProps.get[props[i][0]] = true
        magicProps.all[props[i][0]] = true
      }
      if (typeof props[i][1].set === 'function') {
        // setters
        magicProps.set[props[i][0]] = true
        magicProps.all[props[i][0]] = true
      }
    }
  }

  return magicProps
}

/**
 * Setup MobX observable and Vue Reactive state on an object.
 *
 * @param baseState
 * @param observables
 */
export function reactiveObservable<TStore extends Record<string | number, any>> (
  baseState: TStore,
  observables: TStore,
): UnwrapNestedRefs<TStore> {

  const obj = Object.assign({}, baseState)

  // Handle MobX observable.shallow and observable.ref
  // for (const prop in observables) {
  //   if (isMobXShallow(observables[prop])) {
  //     obj[prop] = shallowRef(shallowReactive(obj[prop]))
  //   }
  // }

  return reactive(obj)
}

/**
 * Detect MobX observable Map.
 *
 * @param obj
 */
function isObservableMap (obj) {
  return obj instanceof ObservableMap
}

/**
 * Detect MobX observable Set.
 *
 * @param obj
 */
function isObservableSet (obj) {
  return obj instanceof ObservableSet
}

/**
 * Detect MobX observable Map or Set.
 *
 * @param obj
 */
function isObservableMapOrSet (obj) {
  return isObservableMap(obj) || isObservableSet(obj)
}

/**
 * Detect MobX observable Map or Set.
 *
 * @param obj
 */
function isStandardMapOrSet (obj) {
  return typeof obj === 'object' && (obj instanceof Map || obj instanceof Set)
}

/**
 * Create shadow prop name.
 *
 * @param prop
 */
export function shadowProp (prop): string {
  return '__' + prop
}

/**
 * Update Vue state property by reassignment
 *
 * @param state
 * @param observable
 * @param newValue
 */
function reassignUpdateVue (state, observable, newValue) {
  // Set property of shadow state.
  state[observable] = isObservableMapOrSet(newValue)
    // If it's an MobX's ObservbaleMap or ObservableSet, copy reference only!
    // Otherwise the reactivity Observable values get lost
    ? newValue
    // Full clone the property without marking it raw
    : cloneDeep(newValue)
}

/**
 * Update Vue state property from MobX deeply.
 *
 * @param state
 * @param observable
 * @param change
 * @param path
 */
function deepUpdateVue (state, observable, change, path = '') {

  path = path === '' ? '' : path.replace('/', '.')
  const ref = path === '' ? state[observable] : get(state[observable], path)

  switch (change.type) {
    case 'add':
    case 'update':
      switch (change.observableKind) {
        case 'map':
          ref.set(change.name, change.newValue);
          break;
        case 'set':
          ref.add(change.newValue);
          break;
        default:
          ref[change.name] = change.newValue;
      }
      break;
    case 'remove':
      delete ref[change.name]
      break;
    case 'delete':
      ref.delete(change.name)
      break;
    case 'splice':
      if (change.added.length) {
        ref.splice(change.index, change.removedCount, ...change.added)
      }
      else {
        ref.splice(change.index, change.removedCount)
      }
      break;
  }
}

/**
 * Update Vue state property from MobX shallowly.
 *
 * @param state
 * @param observable
 * @param change
 */
function shallowUpdateVue (state, observable, change) {
  return deepUpdateVue(state, observable, change)
}


/**
 * Determine if an observable is MobX shallow or ref observable.
 *
 * @param method
 */
function isMobXShallow (method) {
  return method === observable.ref || method === observable.shallow
}

/**
 * Get all object properties including all ancestor prototype properties.
 *
 * @param obj
 */
function getAllProperties (obj) {
  let proto = Object.getPrototypeOf(obj)
  let allProps = Object.getOwnPropertyNames(obj)
  while (proto && proto.constructor.name !== 'Object') {
    allProps.push.apply(allProps, Object.getOwnPropertyNames(proto)
      .filter(el => !['caller', 'callee', 'arguments'].includes(el)))
    proto = Object.getPrototypeOf(proto.constructor.prototype)
  }
  return allProps
}

/**
 * Handle makeAutoObservable() from MobX.
 *
 * @param observables
 * @param allProps
 * @param opts
 * @param shadowAttach
 */
function handleAutoObservables (observables, allProps, opts, shadowAttach) {
  if (observables === 'auto') {
    observables = {}
    for (let i = 0; i < allProps.length; i++) {
      const prop = allProps[i]
      if ((prop in opts.auto && opts.auto[prop] === false)
        || (prop === opts.attach && prop === shadowAttach)
      ) {
        continue;
      }
      observables[prop] = prop in opts.auto ? opts.auto[prop] : true
    }
  }
  return observables
}

/**
 * Create a Vue reactive object that is a shadow of MobX state.
 *
 * @param obj
 * @param observables
 * @param options
 */
export function useMobX<Store extends Record<string, any>> (obj, observables, options = {}): UnwrapNestedRefs<Store | any> {

  // Init options
  const opts = {
    attach: 'vm', // property name to attach to obj
    auto: false,
    ...options
  }

  // If singleton is already instantiated
  // return state property
  const shadowAttach = shadowProp(opts.attach)
  if (opts.attach && shadowAttach in obj) {
    return obj[shadowAttach]
  }

  // Get all the magic setters and getters from the object
  const magicProps = getMagicProps(obj)

  // Get all the props from the source object & its prototype
  const allProps = getAllProperties(obj)

  // Handle makeAutoObservable() from MobX.
  observables = handleAutoObservables(observables, allProps, opts, shadowAttach)

  // Collect all observable definitions
  const baseState = {}
  for (const prop in observables) {
    if (typeof magicProps.get[prop] !== 'undefined') {
      // Skip computed (computed gets assigned to state in computed reaction initialization)
      // to prevent multiple initializations
      continue
    }
    baseState[prop] = typeof obj[prop] === 'function'
      ? async function (...args) {
        await setTimeout(() => {});
        return obj[prop].bind(obj)(...args)
      }
      : (isObservableMapOrSet(obj[prop])
        ? (
          isObservableMap(obj[prop])
            ? new Map(cloneDeep(obj[prop]))
            : new Set(cloneDeep(obj[prop]))
        )
        : cloneDeep(obj[prop]))
  }

  // Setup the base combined MobX observable and Vue reactive state
  const state = reactiveObservable(baseState, observables)


  // Determine if property should be watched by Vue & MobX
  function shouldWatch (obj, magicProps, prop) {
    return typeof magicProps.get[prop] !== 'undefined' || typeof obj[prop] !== 'function'
  }


  // Create shadow of all the props that are not observables

  allProps.forEach(prop => {
    if (typeof observables[prop] === 'undefined' && prop !== opts.attach && prop !== shadowAttach) {
      let getSet = {
        get: typeof obj[prop] === 'function'
          ? function () {
            return async function (...args) {
              await setTimeout(() => {});
              return obj[prop].bind(obj)(...args)
            }
          } : function () {
            return typeof obj[prop] === 'object' ? markRaw(obj[prop]) : obj[prop]
          },
        set: function (value) {
          obj[prop] = value;
        },
        enumerable: true
      }
      Object.defineProperty(state, prop, getSet)
    }
  })

  // MobX reactions
  const createMobXObserver = {}
  // MobX reaction disposers
  const mobxDisposer = {}
  const reassignObserveDisposer = {}
  const createReassignObserver = {}
  // Vue watchers
  const createVueWatcher = {}
  // Vue watch disposers
  const vueDisposer = {}

  // Iterate over all the defined observables
  for (let prop in observables) {

    if (shouldWatch(obj, magicProps, prop)) {

      const isComputed = typeof magicProps.get[prop] !== 'undefined'
      let i = 0;
      // Create a Vue Watcher to set values on the original MobX observable object
      // Watches the values change in the Vue shadow state and sets
      // them back to the MobX observable
      createVueWatcher[prop] = isComputed ? () => () => {} : () => {

        let timeout = {}
        return watch(() => state[prop], function (newValue) {

          console.log('watch', isComputed, prop)
          // Dispose the MobX reaction before setting value
          // to prevent infinite reactive recursion
          mobxDisposer[prop]()
          // Set the value of the original object property
          // Set to raw object instead of reactive() object
          // By calling toRaw() on the new value
          obj[prop] = toRaw(newValue)

          // Recreate MobX reaction and its disposer function after setting a new value
          mobxDisposer[prop] = createMobXObserver[prop]()

        }, { deep: !isMobXShallow(observables[prop]) })
      }

      // Create Vue watcher and store the watch disposer
      vueDisposer[prop] = createVueWatcher[prop]()

      // Create MobX reactions that will change the Vue shadow state reactive() props
      createMobXObserver[prop] = () => {

        if (isComputed) {
          // Handle computed getters
          // Computed getters should be updated shallowly
          const computedHandler = newValue => {

            console.log('computed', prop)
            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[prop]()

            // Update Vue reactive state by reassignment
            reassignUpdateVue(state, prop, newValue)

            // Create Vue watcher and its disposer
            vueDisposer[prop] = createVueWatcher[prop]()
          }

          const computedObserveDisposer = reaction(() => {
            // Computed is intialized into the state only once
            // right here when reaction is initialized
            state[prop] = obj[prop]
          }, computedHandler)

          return () => {
            computedObserveDisposer()
          }
        }
        else {
          // Handle primitives, objects & arrays that are not computed

          // Reaction handler will run only on primitives and when
          // the array/objects are reassigned via = operator, otherwise
          // the deep changes are handled by deepChangeHandler()
          // & shallow changes are handled by shallowChangeHandler()
          const reassignHandler = newValue => {
            console.log('computed')
            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[prop]()

            // Dispose MobX observers as well, because
            // They have to be recreated
            mobxDisposer[prop]()

            // Set property of shadow state.
            reassignUpdateVue(state, prop, newValue)

            // Recreate MobX shallow and deep watchers
            mobxDisposer[prop] = createMobXObserver[prop]()
            // Recreate Vue watcher and its disposer
            vueDisposer[prop] = createVueWatcher[prop]()
          }

          // Create shallow MobX reaction observer
          createReassignObserver[prop] = () => reaction(() => obj[prop], reassignHandler)
          reassignObserveDisposer[prop] = createReassignObserver[prop]()

          // Handle deep object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const deepChangeHandler = (change, path, root) => {
            // console.log('change', change, 'path', path, 'root', root)

            console.log('deepChange')
            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[prop]()

            // Get updated values from MobX and change them in Vue object
            deepUpdateVue(state, prop, change, path)

            // Recreate Vue watcher and its disposer
            vueDisposer[prop] = createVueWatcher[prop]()
          }

          // Handle shallow object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const shallowChangeHandler = (change) => {
            // console.log('change', change)

            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[prop]()

            console.log('shallowChange')
            // Get updated values from MobX and change them in Vue object
            shallowUpdateVue(state, prop, change)

            // Recreate Vue watcher and its disposer
            vueDisposer[prop] = createVueWatcher[prop]()
          }

          const observeDisposer = isMobXShallow(observables[prop])
            ? observe(obj[prop], shallowChangeHandler)
            : deepObserve(obj[prop], deepChangeHandler)

          return () => {
            // MobX shallow and deep disposers
            reassignObserveDisposer[prop]()
            observeDisposer()
          }
        }
      }

      // Create MobX reaction and store the reaction disposer
      mobxDisposer[prop] = createMobXObserver[prop]()
    }
  }

  // Dispose MobX reactions and Vue watchers on
  // scope destruction to prevent memory leaks
  tryOnScopeDispose(() => {
    for (let prop in mobxDisposer) mobxDisposer[prop]()
    for (let prop in vueDisposer) vueDisposer[prop]()
  })

  // Attach to the source object
  // if it is not attached already
  if (opts.attach && !(shadowAttach in obj)) {
    obj[shadowAttach] = state
  }

  return state
}