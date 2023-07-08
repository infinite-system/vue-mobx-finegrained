import { reactive, UnwrapNestedRefs, markRaw } from "vue";
import { tryOnScopeDispose } from '@vueuse/core'
import { reaction, ObservableMap, ObservableSet, observable, observe, computed } from 'mobx'
import { deepObserve } from "mobx-utils";

function getByPath (object, parts) {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }

  return currentObject[last]
}

function setByPath (object, parts, value) {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }

  currentObject[last] = value
}

const deleteByPath = (object, parts) => {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }

  delete currentObject[last]
}

function clone (obj) {

  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    const newArray = []
    for (let i = 0; i < obj.length; i++) {
      newArray[i] = obj[i]
    }
    return newArray;
  }

  if (obj instanceof Object) {
    const newObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = obj[key];
      }
    }
    return newObj;
  }
}

function deepClone (obj) {

  if (typeof obj !== 'object' || obj === null || '__isActiveClone__' in obj) {
    return obj
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    const newArray = []
    for (let i = 0; i < obj.length; i++) {
      newArray[i] = deepClone(obj[i])
    }
    return newArray;
  }

  if (obj instanceof Object) {
    const newObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        obj['__isActiveClone__'] = null
        newObj[key] = deepClone(obj[key])
        delete obj['__isActiveClone__']
      }
    }
    return newObj;
  }
}

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
    : deepClone(newValue)
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

  path = path === '' ? '' : path.replaceAll('/', '.').split('.')
  const ref = path === '' ? state[observable] : getByPath(state[observable], path)

  // console.log(path, 'deep update',  change, change.newValue)
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
  if (opts.auto) {
    for (let i = 0; i < allProps.length; i++) {
      const prop = allProps[i]
      if ((prop in observables && observables[prop] === false)
        || (prop === opts.attach || prop === shadowAttach || prop === 'constructor')
      ) {
        delete observables[prop]
        continue;
      }
      observables[prop] = prop in observables ? observables[prop] : true
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

  const originalObservables = observables;
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
      // Skip computed (computed gets assigned to vue in computed reaction initialization)
      // to prevent multiple initializations
      continue
    }
    baseState[prop] = typeof obj[prop] === 'function'
      ? function (...args) {
        return obj[prop].bind(obj)(...args)
      }
      : (isObservableMapOrSet(obj[prop])
        ? (
          isObservableMap(obj[prop])
            ? obj[prop]
            : obj[prop]
        )
        : deepClone(obj[prop]))
  }

  // Setup the base combined MobX observable and Vue reactive state
  const o = Object.assign({}, baseState)
  const vue = reactive(o)

  // Create shadow of all the props that are not observables
  allProps.forEach(prop => {
    if (typeof observables[prop] === 'undefined' && prop !== opts.attach && prop !== shadowAttach) {
      let getSet = {
        get: typeof obj[prop] === 'function'
          ? function () {
            return function (...args) {
              return obj[prop].bind(obj)(...args)
            }
          } : function () {
            // console.log('get '+ prop)
            return typeof obj[prop] === 'object' ? markRaw(obj[prop]) : obj[prop]
          },
        set: function (value) {
          obj[prop] = value;
        },
        enumerable: true
      }
      Object.defineProperty(vue, prop, getSet)
    }
  })

  // MobX reactions
  const createMobXObserver = {}
  // MobX reaction disposers
  const mobxDisposer = {}
  const reassignObserveDisposer = {}
  const createReassignObserver = {}

  const shallowObjects = {}
  const computedObjects = {}

  // console.log('observables', observables)

  // Determine if property should be watched by Vue & MobX
  function shouldWatch (obj, prop, magicProps) {
    return typeof magicProps.get[prop] !== 'undefined' || typeof obj[prop] !== 'function'
  }

  // Iterate over all the defined observables
  for (const prop in observables) {

    if (!observables[prop]) continue

    if (shouldWatch(obj, prop, magicProps)) {

      if (observables[prop] === observable.shallow || observables[prop] === observable.ref) {
        shallowObjects[prop] = true
      }

      let isComputed = false
      if (observables[prop] === computed || observables[prop] === computed.struct) {
        computedObjects[prop] = true
        isComputed = true
      }
      else if (opts.auto
        && observables[prop] !== false
        && typeof magicProps.get[prop] !== 'undefined'
      ) {
        computedObjects[prop] = true
        isComputed = true
      }


      // Create MobX reactions that will change the Vue shadow state reactive() props
      createMobXObserver[prop] = () => {

        if (isComputed) {
          // Handle computed getters
          // Computed getters should be updated shallowly
          const computedHandler = newValue => reassignUpdateVue(vue, prop, newValue)

          const computedObserveDisposer = reaction(() => {
            // Computed is intialized into the Vue state only once
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
            reassignUpdateVue(vue, prop, newValue)
            // Recreate MobX shallow and deep watchers
            mobxDisposer[prop] = createMobXObserver[prop]()
          }

          // Create shallow MobX reaction observer
          createReassignObserver[prop] = () => reaction(() => obj[prop], reassignHandler)
          reassignObserveDisposer[prop] = createReassignObserver[prop]()

          // Handle deep object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const deepChangeHandler = (change, path, root) => deepUpdateVue(vue, prop, change, path)

          // Handle shallow object changes in MobX and mirror them into the Vue reactive state
          // based on those changes. More: https://github.com/mobxjs/mobx-utils#deepobserve
          // https://github.com/mobxjs/mobx/issues/214
          const shallowChangeHandler = (change) => shallowUpdateVue(vue, prop, change)

          let observeDisposer;
          if (isMobXShallow(observables[prop])) {
            observeDisposer = observe(obj[prop], shallowChangeHandler)
          }
          else {
            observeDisposer = deepObserve(obj[prop], deepChangeHandler)
          }

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
  })

  // Attach to the source object
  // if it is not attached already
  if (opts.attach && !(shadowAttach in obj)) {
    obj[shadowAttach] = vue
  }

  const shallowObjectHandler = (prop: string, path: string[] = []) => ({

    get: (target, key): any => {

      if (typeof target === 'object') {

        let value

        if (target instanceof Map
          || target instanceof Set
          || target instanceof ObservableMap
          || target instanceof ObservableSet) {
          value = target[key]
          // console.log(`Getting Map/Set/ObservableMap/ObservableSet at root key [${key}]:`, value, 'constructor.name:', target.constructor.name)
        }
        else {
          // console.log(`Getting deep function at:`, path.slice(0).concat(key))
          value = path.length === 0 ? target[key] : getByPath(obj[prop], path.slice(0).concat(key))
        }

        if (typeof value === "function") return value.bind(target)
      }

      if (typeof target[key] === 'object' && target[key] !== null) {
        // console.log('Create new Proxy at path:', fullPath)
        return new Proxy(
          target[key],
          shallowObjectHandler(prop, path.slice(0).concat(key))
        )
      }

      return target[key];
    },
    set: (target, key, value) => {
      if (!path.length) {
        // console.log('Setting root value at key:', key, 'value:', value)
        obj[prop][key] = value
      }
      else {
        console.log('Setting deep object value at path:', path.slice(0).concat(key), 'newValue:', value, 'oldValue:', getByPath(obj[prop], path.slice(0).concat(key)))
        setByPath(vue[prop], path.slice(0).concat(key), value)
        setByPath(obj[prop], path.slice(0).concat(key), value)
      }
      return true;
    },
    deleteProperty (target, key) {
      if (path.length === 0) {
        // console.log('Deleting root value at key:', key);
        delete vue[prop][key]
      }
      else {
        deleteByPath(vue[prop], path.slice(0).concat(key))
      }
      return true;
    },
  });

  for (const prop in shallowObjects) {
    obj['_' + prop] = new Proxy(obj[prop], shallowObjectHandler(prop))
  }

  const createHandler = (path: string[] = []) => ({

    get: (target, key): any => {


      if (typeof target === 'object') {

        let value
        if (target instanceof Map
          || target instanceof Set
          || target instanceof ObservableMap
          || target instanceof ObservableSet) {
          value = target[key]
          // console.log(`Getting Map/Set/ObservableMap/ObservableSet at root key [${key}]:`, value, 'constructor.name:', target.constructor.name)
        }
        else {
          // console.log(`Getting deep function at:`, path.slice(0).concat(key))
          value = path.length === 0
            ? target[key]
            : getByPath(target, path.slice(0).concat(key))
        }

        if (typeof value === "function") return value.bind(target)
      }

      if (typeof target[key] === 'object' && target[key] !== null) {
        return new Proxy(
          target[key],
          createHandler(path.slice(0).concat(key))
        )
      }
      return target[key];
    },
    set: (target, key, value) => {
      // console.log(`Setting ${path.join('.') + '.' + key} to: `, value, path);
      if (!path.length) {
        // console.log('Setting at root...', key, 'value:', value)
        if (key in computedObjects) {
          vue[key] = value
        }
        else {
          obj[key] = value
        }
      }
      else {

        if (path[0] in computedObjects) {
          setByPath(vue, path.slice(0).concat(key), value)
        }
        else if (path[0] in shallowObjects) {
          setByPath(obj, path.slice(0).concat(key), value)
          setByPath(vue, path.slice(0).concat(key), value)
        }
        else {
          setByPath(obj, path.slice(0).concat(key), value)
        }
      }
      return true;
    },
    deleteProperty (target, key) {
      if (path.length === 0) {
        // console.log(`Deleting root prop ${path.join('.') + '.' + key}`);
        if (key in computedObjects) {
          delete vue[key]
        }
        else {
          delete obj[key]
        }
      }
      else {

        if (path[0] in computedObjects) {
          deleteByPath(vue, path.slice(0).concat(key))
        }
        else if (path[0] in shallowObjects) {
          deleteByPath(obj, path.slice(0).concat(key))
          deleteByPath(vue, path.slice(0).concat(key))
        }
        else {
          deleteByPath(obj, path.slice(0).concat(key))
        }

      }
      return true;
    },
  });


  return new Proxy(vue, createHandler())
}