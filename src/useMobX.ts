import { reactive, UnwrapNestedRefs, markRaw } from "vue";
import { tryOnScopeDispose } from '@vueuse/core'
import { reaction, observable, observe, computed, ObservableMap, ObservableSet, toJS, isObservable } from 'mobx'
import { deepObserve } from "mobx-utils";
import {
  clone,
  deepClone,
  getByPath,
  setByPath,
  deleteByPath,
  isObservableMapOrSet,
  getAllProperties,
  getMagicProperties
} from "./utils.js";

/**
 * Notify MobX reactivity system of changes and
 * propagate to Vue state, by reassigning values.
 * Usually used to propagate deep computed changes.
 *
 * @param obj
 */
export function notify (obj) {
  return clone(obj)
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
function reassignUpdateVue (state, observable, newValue, opts) {
  // Set property of shadow state.

  console.log('reassignUpdateVue', 'newValue', newValue, 'isObservable', isObservable(newValue))
  state[observable] = isObservableMapOrSet(newValue)
    // If it's an MobX's ObservbaleMap or ObservableSet, copy reference only!
    // Otherwise the reactivity to Observable values get lost
    ? newValue
    // Full clone the property
    : opts.deepCloneFn(newValue)
}

/**
 * Update Vue state property from the default MobX observable(.deep)
 *
 * @param state
 * @param observable
 * @param change
 * @param path
 * @param root
 */
function deepUpdateVue (state, observable, change, path = '', root = null) {

  path = path === '' ? '' : path.replaceAll('/', '.').split('.')


  // console.log(
  //   'Deep update',
  //   'prop:', observable,
  //   'path:', path,
  //   'change:', change,
  //   'newValue:', change.newValue,
  //   'root:', root
  // )


  const ref = path === '' ? state[observable] : getByPath(state[observable], path)



  switch (change.type) {
    case 'add':
    case 'update':

      // console.log('newValue', change.newValue, 'isObservable', isObservable(change.newValue))
      const newValue = isObservable(change.newValue)
        ? deepClone(change.newValue)
        : change.newValue

      switch (change.observableKind) {
        case 'map': // Handles Maps
          ref.set(change.name, newValue);
          break;
        case 'set': // Handles Sets
          ref.add(newValue);
          break;
        default:
          if (typeof ref === "object") {
            if ('index' in change) { // Handles Arrays
              ref[change.index] = newValue;
            }
            else { // Handles Objects
              ref[change.name] = newValue;
            }
          }
      }
      break;
    case 'remove': // Handles Objects
      if (typeof ref === 'object') {
        delete ref[change.name]
      }
      break;
    case 'delete': // Handles Map.delete()
      ref.delete(change.name)
      break;
    case 'splice': // Handles Arrays .push, .pop, .splice, .unshift, .shift
      if (change.added.length) {
        const changeAdded = change.added
          console.log('newValue', change.newValue, 'isObservable', isObservable(change.newValue))
        for(let i =0; i < change.added.length; i++){

          changeAdded[i] = isObservable(change.added[i])
            ? deepClone(change.added[i]) : change.added[i]
        }
        ref.splice(change.index, change.removedCount, ...changeAdded)
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
 * observable.shallow: tracks first level props only
 * observable.ref: tracks reassignments only
 *
 * @param method
 */
function isMobXShallow (method) {
  return method === observable.shallow || method === observable.ref
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
  if (opts.auto) {

    for (let i = 0; i < allProps.length; i++) {

      const prop = allProps[i]

      if ((prop in observables && observables[prop] === false)
        || (prop === opts.attach || prop === shadowAttach || prop === 'constructor')
      ) {
        // Delete MobX false observable overrides, as well as [this.vm, this._vm, this.constructor] props from observables
        delete observables[prop]
        continue;
      }

      observables[prop] = prop in observables
        // handle overrides
        ? observables[prop]
        // auto props assign to simple boolean true
        : true
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
    attach: 'vm', // default property name to attach to obj
    auto: false,
    deepCloneFn: deepClone,
    ...options
  }

  // If singleton is already instantiated
  // return state property
  const shadowAttach = shadowProp(opts.attach)
  if (opts.attach && shadowAttach in obj) {
    return obj[shadowAttach]
  }

  // Get all the magic setters and getters from the object
  const magicProps = getMagicProperties(obj)

  // Get all the props from the source object & its prototype
  const allProps = getAllProperties(obj)

  // Handle makeAutoObservable() from MobX.
  observables = handleAutoObservables(observables, allProps, opts, shadowAttach)

  // Collect all observable definitions for Vue initial state
  const baseState = {}
  for (const prop in observables) {
    if (typeof magicProps.get[prop] !== 'undefined') {
      // Skip computed (computed gets assigned to vue in computed reaction initialization)
      // to prevent multiple initializations, see [computedObserveDisposer] computed is initialized
      continue
    }
    baseState[prop] = typeof obj[prop] === 'function'
      ? function (...args) {
        return obj[prop].bind(obj)(...args)
      }
      : (isObservableMapOrSet(obj[prop]) ? obj[prop] : opts.deepCloneFn(obj[prop]))
  }

  // Setup the base combined MobX observable and Vue reactive state
  const vue = reactive(baseState)

  // Create shadow of all the props that are not observables
  allProps.forEach(prop => {

    if (!(prop in observables)
      // skip this.vm && this.__vm shadow props
      && prop !== opts.attach
      && prop !== shadowAttach) {

      Object.defineProperty(vue, prop, {
        get: typeof obj[prop] === 'function'
          ? function () {
            return function (...args) {
              return obj[prop].bind(obj)(...args)
            }
          }
          : function () {
            return typeof obj[prop] === 'object' ? markRaw(obj[prop]) : obj[prop]
          },
        set: function (value) {
          obj[prop] = value;
        },
        enumerable: true
      })
    }
  })

  // MobX reactions
  const createMobXObserver = {}
  const createReassignObserver = {}
  const mobxDisposer = {}
  const reassignObserveDisposer = {}

  // Collections for shallow and computed props
  const computedProps = {}
  const shallowRefProps = {}
  const refProps = {}

  // Determine if property should be observed by Vue & MobX
  function shouldObserve (obj, prop, magicProps) {
    // computed getter should be observed
    return typeof magicProps.get[prop] !== 'undefined'
      // or anything that is not a function
      || typeof obj[prop] !== 'function'
  }

  // Iterate over all the defined observables
  for (const prop in observables) {

    // false overrides should be skipped
    if (observables[prop] === false) continue

    if (shouldObserve(obj, prop, magicProps)) {

      // Collect shallow & ref observable props
      if (observables[prop] === observable.shallow || observables[prop] === observable.ref) {
        shallowRefProps[prop] = true
        if (observables[prop] === observable.ref) {
          refProps[prop] = true
        }
      }

      // Determine and collect computed getters
      let isComputed = false
      if (observables[prop] === computed || observables[prop] === computed.struct) {
        computedProps[prop] = true
        isComputed = true
      }
      else if (opts.auto
        && observables[prop] !== false
        && typeof magicProps.get[prop] !== 'undefined'
      ) {
        computedProps[prop] = true
        isComputed = true
      }

      // Create MobX reactions that will change the Vue shadow state reactive() props
      createMobXObserver[prop] = () => {

        if (isComputed) {
          // Handle computed getters
          // Computed getters should be updated shallowly
          const computedHandler = newValue => {
            console.log('computed handler')
            //reassignUpdateVue(vue, prop, newValue, opts)
          }

          const computedObserveDisposer = reaction(() => {
            // console.log('init', prop)
            // Computed is initialized into the Vue state only once!
            // right here when reaction is initialized
            vue[prop] = obj[prop]
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
            // Dispose MobX observers
            // They have to be recreated
            mobxDisposer[prop]()
            // Set property of shadow Vue state.
            reassignUpdateVue(vue, prop, newValue, opts)
            // Recreate MobX shallow and deep watchers
            mobxDisposer[prop] = createMobXObserver[prop]()
          }

          // Create shallow MobX reaction observer
          createReassignObserver[prop] = () => reaction(() => obj[prop], reassignHandler)
          reassignObserveDisposer[prop] = createReassignObserver[prop]()

          // Handle deep object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const deepChangeHandler = (change, path, root) => {
            deepUpdateVue(vue, prop, change, path, root)
          }

          // Handle shallow object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const shallowChangeHandler = (change) => {
            shallowUpdateVue(vue, prop, change)
          }

          let observeDisposer = isMobXShallow(observables[prop])
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
    for (const prop in mobxDisposer) mobxDisposer[prop]()
  })

  // Attach to the source object
  // if it is not attached already
  if (opts.attach && !(shadowAttach in obj)) {
    obj[shadowAttach] = vue
  }

  function isMapOrSet (target) {
    return target instanceof Map
      || target instanceof Set
      || target instanceof ObservableMap
      || target instanceof ObservableSet
  }

  // Handle MobX observable.shallow and observable.ref
  // Make them manually be able to change Vue state using Proxies
  // This extends beyond standard MobX for high performance with large objects/arrays
  // yet maintaining reactivity on the front-end
  const shallowPropProxyHandler = (prop: string, path: string[] = []) => ({

    /**
     * Handle getting the prop value.
     *
     * @param target
     * @param key
     */
    get: (target, key): any => {


      console.log('key', key)
      if (typeof target === 'object') {

        // Handle functions
        let fn

        if (isMapOrSet(target)) {
          fn = target[key]
          // console.log(`Getting Map/Set/ObservableMap/ObservableSet at root key [${key}]:`, value, 'instance:', target.constructor.name)
        }
        else {
          // console.log(`Getting deep function at:`, path.slice(0).concat(key))
          fn = path.length === 0
            // Handle root path
            ? target[key]
            // Handle deep path
            : getByPath(obj[prop], path.slice(0).concat(key))
        }

        if (typeof fn === "function") {
          // Handle methods for Objects, Arrays, Maps, Sets,
          // like .push, .pop, .unshift, .shift, .delete, etc.
          return fn.bind(target)
        }
      }

      if (typeof target[key] === 'object' && target[key] !== null) {
        // console.log('Create new Proxy at path:', fullPath)
        // Handle deep object
        return new Proxy(
          target[key],
          shallowPropProxyHandler(prop, path.slice(0).concat(key))
        )
      }

      return target[key];
    },

    /**
     * Handle setting the prop value.
     *
     * @param target
     * @param key
     * @param value
     */
    set: (target, key, value) => {
      // Handle root path
      if (!path.length) {
        // console.log('Setting root[prop] value at key:', key, 'value:', value)
        obj[prop][key] = value
        if (prop in refProps) {
          // MobX observable.ref will not change vue[prop][key]
          // it observes only vue[prop] reassignment, so
          // we change it manually:
          vue[prop][key] = value
        }
      }
      // Handle deep path
      else {
        // console.log('Setting deep prop value at path:', path.slice(0).concat(key), 'newValue:', value, 'oldValue:', getByPath(obj[prop], path.slice(0).concat(key)))
        setByPath(vue[prop], path.slice(0).concat(key), value)
        setByPath(obj[prop], path.slice(0).concat(key), value)
      }
      return true;
    },

    /**
     * Handle deleting the prop value.
     *
     * @param target
     * @param key
     */
    deleteProperty (target, key) {
      // Handle root path
      if (path.length === 0) {
        // console.log('Deleting root value at key:', key);
        delete obj[prop][key]
      }
      // Handle deep path
      else {
        deleteByPath(obj[prop], path.slice(0).concat(key))
      }
      return true;
    },
  });

  for (const prop in shallowRefProps) {
    obj['_' + prop] = new Proxy(obj[prop], shallowPropProxyHandler(prop))
  }

  // Vue Proxy for fast synchronous assignment from Vue to MobX
  // Note: initially this was implemented using Vues watch() method but
  // was slow and asynchronous, so implementing it via a new Proxy()
  // made things an order of magnitude faster and fully synchronous.
  // Proxy vueHandler handles nested Objects, Arrays, Maps and Sets.
  const vueProxyHandler = (path: string[] = []) => ({

    /**
     * Handle getting the prop value.
     *
     * @param target
     * @param key
     */
    get: (target, key): any => {

      // console.log('key', key)
      if (typeof target === 'object') {

        let fn

        // Handle root path & Maps / Sets
        if (path.length === 0 || isMapOrSet(target)) {
          fn = target[key]
          // console.log(`Getting root function at [${key}]:`, fn)
        }
        // Handle deep path
        else {
          fn = getByPath(target, path.slice(0).concat(key))
          // console.log(`Getting deep function at:`, path.slice(0).concat(key), fn)
        }

        if (typeof fn === "function") {
          // Handle methods for Objects, Arrays, Maps, Sets,
          // like .push, .pop, .unshift, .shift, .delete, etc.
          return fn.bind(target)
        }
      }

      if (typeof target[key] === 'object' && target[key] !== null) {
        // Handle deep object
        return new Proxy(
          target[key],
          vueProxyHandler(path.slice(0).concat(key))
        )
      }

      return target[key];
    },

    /**
     * Handle setting the prop value.
     *
     * @param target
     * @param key
     * @param value
     */
    set: (target, key, value) => {

      // Handle root path
      if (path.length === 0) {
        // console.log('Proxy set at root key:', key, 'value:', value)
        if (key in computedProps) {
          vue[key] = value
        }
        else {
          obj[key] = value
        }
      }
      // Handle deep path
      else {
        // console.log(`Proxy set ${path.slice(0).concat(key).join('.')} to: `, value, path);
        if (path[0] in computedProps) {
          // Modify only Vue prop because MobX is in computed mode
          setByPath(vue, path.slice(0).concat(key), value)
        }
        else if (path[0] in shallowRefProps) {
          // MobX observable.shallow and observable.ref
          // Will not react so we have to modify both Vue and MobX
          setByPath(obj, path.slice(0).concat(key), value)
          setByPath(vue, path.slice(0).concat(key), value)
        }
        else {
          setByPath(obj, path.slice(0).concat(key), value)
          // no need to set vue state by path, because MobX will handle it here.
          // see deepObserve and deepChangeHandler() above
        }
      }
      return true;
    },

    /**
     * Handle deleting the prop value.
     *
     * @param target
     * @param key
     */
    deleteProperty (target, key) {
      // console.log(`Deleting root prop ${path.slice(0).concat(key).join('.')}`);
      // Handle root path
      if (path.length === 0) {
        if (key in computedProps) {
          // Delete only Vue state prop since MobX is in computed mode
          delete vue[key]
        }
        else {
          delete obj[key]

          // MobX does not detect delete on array keys
          // so next line is necessary to delete the Vue key
          delete vue[key]
        }
      }
      // Handle deep path
      else {
        if (path[0] in computedProps) {
          // Modify only Vue prop because MobX is in computed mode
          deleteByPath(vue, path.slice(0).concat(key))
        }
        else if (path[0] in shallowRefProps) {
          // MobX observable.shallow and observable.ref
          // Will not react so we have to modify both Vue and MobX
          deleteByPath(obj, path.slice(0).concat(key))
          deleteByPath(vue, path.slice(0).concat(key))
        }
        else {
          deleteByPath(obj, path.slice(0).concat(key))
          // MobX does not detect delete on array keys
          // so next line is necessary to delete the Vue key
          deleteByPath(vue, path.slice(0).concat(key))
        }
      }
      return true;
    },
  });

  return new Proxy(vue, vueProxyHandler())
}