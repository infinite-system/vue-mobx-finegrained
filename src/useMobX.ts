import { markRaw, reactive, watch, UnwrapNestedRefs, toRaw, nextTick } from "vue";
import { tryOnScopeDispose } from '@vueuse/core'

import { observable, reaction, makeObservable, toJS, autorun, ObservableMap, ObservableSet } from 'mobx'
import type { AnnotationsMap } from 'mobx'
import { deepObserve } from "mobx-utils";
import get from 'lodash/get'
import set from 'lodash/set'

/**
 * Create a shallow object clone very quickly.
 *
 * @param obj
 */
export function shallowClone (obj) {
  if (obj === null || typeof obj !== 'object' || '__isActiveClone__' in obj) {
    return obj;
  }
  let cloned = obj instanceof Date ? new Date(obj) : obj.constructor();
  return Array.isArray(obj) ? obj.slice(0) : Object.assign(cloned, obj)
}

/**
 * Notify MobX reactivity system of changes to propagate Vue reactive changes, by reassigning values.
 *
 * @param obj
 * @param prop
 * @param key
 */
export function notify (obj) {
  return shallowClone(obj)
}

/**
 * Very quick full clone function.
 *
 * @param obj
 */
export function fullClone (obj) {

  if (obj === null || typeof obj !== 'object' || '__isActiveClone__' in obj) {
    return obj;
  }

  let cloned = obj instanceof Date ? new Date(obj) : new obj.constructor();

  if (Array.isArray(obj)) {
    const objLength = obj.length;
    for (let key = 0; key < objLength; key++) {
      cloned[key] = fullClone(obj[key]);
    }
  }
  else {
    for (let key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj['__isActiveClone__'] = null;
        // if (cloned === undefined){
        //   console.log('underfined..', new obj.constructor())
        // }
        cloned[key] = fullClone(obj[key]);
        delete obj['__isActiveClone__'];

      }
    }
  }

  return cloned;
}

/**
 * Get setters and getters of a class instance.
 * Also gets all magic methods (getters and setters) stored in 'all' param.
 *
 * @param instance
 * @return { get: [...], set: [...], all: [...] }
 */
function getMagicProps (instance) {

  const props = Object.entries(
    Object.getOwnPropertyDescriptors(
      Reflect.getPrototypeOf(instance)
    )
  )

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
 * @param observers
 * @param raw
 * @param annotations
 */
export function reactiveObservable<TStore extends Record<string | number, any>> (
  observers: TStore,
  raw: Array<any> | Boolean = [],
): UnwrapNestedRefs<TStore> {

  const obj = Object.assign({}, observers)

  if (Array.isArray(raw)) {
    raw.forEach(prop => {
      if (typeof obj[prop] === 'object') {
        if (Array.isArray(obj[prop])) {
          obj[prop] = obj[prop].map(el => markRaw(el))
        }
        else {
          obj[prop] = markRaw(obj[prop])
        }
      }
    })
  }
  else if (raw === true) {
    for (const prop in observers) {
      if (typeof observers[prop] === 'object') {
        if (Array.isArray(obj[prop])) {
          obj[prop] = obj[prop].map(el => typeof el === 'object' ? markRaw(el) : el)
        }
        else {
          obj[prop] = markRaw(obj[prop])
        }
      }
    }
  }

  return reactive(obj)
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
 * Create a Vue reactive object that is a shadow of MobX state.
 *
 * @param obj
 * @param observables
 * @param options
 */
export function useMobX<Store extends Record<string, any>> (obj, observables, options = {}): UnwrapNestedRefs<Store | any> {

  function shallowUpdateVue (state, observable, newValue, opts) {
    // Set property of shadow state.

    // If option opts.raw === true, Vues markRaw() will tag all objects as raw objects
    // preventing huge reactivity objects from being created (use opts.raw = true)
    // If option opts.raw is an array of properties, then markRaw()
    // will be applied only to those object properties
    if (opts.raw === true || typeof rawMap[observable] !== 'undefined') {
      // Handle raw
      if (typeof state[observable] === 'object') {
        if (Array.isArray(newValue)) {
          // Handle array
          state[observable] = newValue.map(el => typeof el === 'object' ? markRaw(fullClone(el)) : fullClone(el))
        }
        else {
          // Handle object
          state[observable] =
            newValue instanceof ObservableMap || newValue instanceof ObservableSet
              // If it's an MobX's ObservbaleMap, copy reference only!
              // Otherwise the reactivity gets lost
              ? markRaw(newValue)
              : markRaw(fullClone(newValue))
        }
      }
      else {
        // Primitives values are copied by value, no need to markRaw() or clone them
        state[observable] = newValue
      }
    }
    else {
      state[observable] = newValue instanceof ObservableMap || newValue instanceof ObservableSet
        // If it's an MobX's ObservbaleMap, copy reference only!
        // Otherwise the reactivity Observable values get lost
        ? newValue
        // Full clone the property without marking it raw
        : fullClone(newValue)
    }
  }

  function deepUpdateVue (state, observable, change, path) {
    path = path.replaceAll('/', '.')

    const ref = (path === '' ? state[observable] : get(state[observable], path))

    switch (change.type) {
      case 'add':
      case 'update':
        ref[change.name] = change.newValue
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

  // Init options
  const opts = {
    ...{
      raw: false, // true for all observables or [] of items that must be markRaw()
      attach: 'vm', // property name to attach to obj
    },
    ...options
  }

  const shadowAttach = shadowProp(opts.attach)
  // If singleton is already instantiated
  // return state property
  if (opts.attach && shadowAttach in obj) {
    return obj[shadowAttach]
  }

  // Get all the magic setters and getters from the object
  const magicProps = getMagicProps(obj)

  // Collect all observable definitions
  const observers = {}
  for (const observable in observables) {
    observers[observable] = typeof obj[observable] === 'function'
      ? async function (...args) {
        await setTimeout(() => {});
        return obj[observable].bind(obj)(...args)
      }
      : (obj[observable] instanceof ObservableMap || obj[observable] instanceof ObservableSet
        ? obj[observable]
        : fullClone(obj[observable]))
  }

  // Setup the base combined MobX observable and Vue reactive state
  const state = reactiveObservable(observers, opts.raw)

  // Create a raw map for fast access
  const rawMap = {}
  if (Array.isArray(opts.raw)) {
    opts.raw.forEach(prop => rawMap[prop] = true)
  }

  // Determine if property should be watched by Vue & MobX
  function shouldWatch (obj, magicProps, observables, observable) {
    return typeof magicProps.get[observable] !== 'undefined' || typeof obj[observable] !== 'function'
  }

  // Get all the props from the source object
  const allProps = Object.getOwnPropertyNames(obj)
    .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(obj)));

  // Create shadow of all the props that are not observables
  allProps.forEach(prop => {
    if (typeof observables[prop] === 'undefined' && prop !== opts.attach && prop !== shadowAttach) {
      if (typeof obj[prop] === 'function') {
        state[prop] = async function (...args) {
          await setTimeout(() => {});
          return obj[prop].bind(obj)(...args)
        }
      }
      else {
        Object.defineProperty(state, prop, {
          get: function () {
            return obj[prop]
          },
          set: function (value) {
            obj[prop] = value;
          }
        })
      }
    }
  })

  // MobX reactions
  const createMobXObserver = {}
  // MobX reaction disposers
  const mobxDisposer = {}

  // Vue watchers
  const createVueWatcher = {}
  // Vue watch disposers
  const vueDisposer = {}

  // Iterate over all the defined observables
  for (let observable in observables) {

    if (shouldWatch(obj, magicProps, observables, observable)) {

      // Create a Vue Watcher to set values on the original MobX observable object
      // Watches the values change in the Vue shadow state and sets
      // them back to the MobX observable
      createVueWatcher[observable] = () => {

        return watch(() => state[observable], function (newValue) {

          // Dispose the MobX reaction before setting value
          // to prevent infinite reactive recursion
          mobxDisposer[observable]()

          // Set the value of the original object property
          // Set to raw object instead of reactive() object
          // By calling toRaw() on the new value
          obj[observable] = toRaw(newValue)

          // Recreate MobX reaction and its disposer function after setting a new value
          mobxDisposer[observable] = createMobXObserver[observable]()
        }, { deep: true })
      }

      // Create Vue watcher and store the watch disposer
      vueDisposer[observable] = createVueWatcher[observable]()

      // Create MobX reactions that will change the Vue shadow state reactive() props
      createMobXObserver[observable] = () => {

        const isComputedGetter = typeof magicProps.get[observable] !== 'undefined'

        if (isComputedGetter) {
          // Handle computed getters
          // Computed getters should be updated shallowly
          const computedHandler = newValue => {

            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[observable]()

            // Update Vue reactive state by reassignment
            shallowUpdateVue(state, observable, newValue, opts)

            // Create Vue watcher and its disposer
            vueDisposer[observable] = createVueWatcher[observable]()
          }

          const computedObserveDisposer = reaction(() => obj[observable], computedHandler)

          return () => {
            computedObserveDisposer()
          }
        }
        else {
          // Handle regular primitives, objects & arrays that are not computed

          // Reaction handler will run only on primitives and when
          // the array/objects are reassigned via = operator, otherwise
          // the deep changes are handled by deepObserveHandler()
          const reactionHandler = (newValue, oldValue) => {

            if (oldValue !== newValue) {
              // Dispose the Vue watcher before setting a value.
              // This is to prevent infinite recursion
              vueDisposer[observable]()

              // Dispose MobX observers as well, because
              // They have to be recreated
              mobxDisposer[observable]()

              // Set property of shadow state.
              shallowUpdateVue(state, observable, newValue, opts)

              // Recreate MobX shallow and deep watchers
              mobxDisposer[observable] = createMobXObserver[observable]()
              // Recreate Vue watcher and its disposer
              vueDisposer[observable] = createVueWatcher[observable]()
            }
          }

          // Create shallow MobX reaction observer
          const shallowObserveDisposer = reaction(() => obj[observable], reactionHandler)

          // Handle deep object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const deepObserveHandler = (change, path, root) => {
            // console.log('change', change, 'path', path, 'root', root)

            // Dispose the Vue watcher before setting a value.
            // This is to prevent infinite recursion
            vueDisposer[observable]()

            // Get updated values from MobX and change them in Vue object
            deepUpdateVue(state, observable, change, path)

            // Recreate Vue watcher and its disposer
            vueDisposer[observable] = createVueWatcher[observable]()
          }

          const deepObserveDisposer = deepObserve(obj[observable], deepObserveHandler)

          return () => {
            // MobX shallow and deep disposers
            shallowObserveDisposer()
            deepObserveDisposer()
          }
        }
      }

      // Create MobX reaction and store the reaction disposer
      mobxDisposer[observable] = createMobXObserver[observable]()
    }
  }

  // Dispose MobX reactions and Vue watchers on
  // scope destruction to prevent memory leaks
  tryOnScopeDispose(() => {
    for (let observable in mobxDisposer) mobxDisposer[observable]()
    for (let observable in vueDisposer) vueDisposer[observable]()
  })

  // Attach to the source object
  // if it is not attached already
  if (opts.attach && !(shadowAttach in obj)) {
    obj[shadowAttach] = state
  }

  return state
}