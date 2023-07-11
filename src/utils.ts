import { ObservableMap, ObservableSet } from "mobx";

/**
 * Get deep object property via parts array.
 *
 * @param object
 * @param parts
 */
export function getByPath (object, parts) {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }

  return currentObject[last]
}

/**
 * Set object property via parts array.
 *
 * @param object
 * @param parts
 * @param value
 */
export function setByPath (object, parts, value) {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }

  currentObject[last] = value
}

/**
 * Delete object property via parts array.
 *
 * @param object
 * @param parts
 */
export function deleteByPath (object, parts) {

  let currentObject = object
  const last = parts.pop()

  for (const part of parts) {
    currentObject = currentObject[part]
    if (!currentObject) return
  }
  if (typeof currentObject[last] !== 'undefined'){
    delete currentObject[last]
  }
}

/**
 * Shallow clone an object.
 *
 * @param obj
 */
export function clone (obj) {

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

/**
 * Deep clone an object.
 *
 * @param obj
 */
export function deepClone (obj) {

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
        obj['__isActiveClone__'] = true
        newObj[key] = deepClone(obj[key])
        delete obj['__isActiveClone__']
      }
    }
    return newObj;
  }
}

/**
 * Get setters and getters of a class instance.
 * Also gets all magic methods (getters and setters) stored in 'all' param.
 *
 * @param instance
 * @return { get: [...], set: [...], all: [...] }
 */
export function getMagicProps (instance) {

  let proto = Object.getPrototypeOf(instance)

  let props = []
  while (proto && proto.constructor.name !== 'Object') {
    props.push.apply(props, Object.entries(
      Object.getOwnPropertyDescriptors(proto)
    ))
    proto = Object.getPrototypeOf(proto.constructor.prototype)
  }

  const magicProps = { get: {}, set: {} }

  for (let i = 0; i < props.length; i++) {
    if (props[i][0] !== '__proto__') {
      if (typeof props[i][1].get === 'function') {
        // getters
        magicProps.get[props[i][0]] = true
      }
      if (typeof props[i][1].set === 'function') {
        // setters
        magicProps.set[props[i][0]] = true
      }
    }
  }

  return magicProps
}

/**
 * Get all object properties including all ancestor prototype properties.
 *
 * @param obj
 */
export function getAllProperties (obj) {

  let proto = Object.getPrototypeOf(obj)
  let allProps = Object.getOwnPropertyNames(obj)

  // this determines all the ancestor prototype props  as well
  while (proto && proto.constructor.name !== 'Object') {
    allProps.push.apply(allProps, Object.getOwnPropertyNames(proto)
      // caller, callee, arguments are not accessible so should be skipped
      .filter(el => !['caller', 'callee', 'arguments'].includes(el)))
    proto = Object.getPrototypeOf(proto.constructor.prototype)
  }

  return Array.from(new Set(allProps))
}

/**
 * Detect MobX observable Map.
 *
 * @param obj
 */
export function isObservableMap (obj) {
  return obj instanceof ObservableMap
}

/**
 * Detect MobX observable Set.
 *
 * @param obj
 */
export function isObservableSet (obj) {
  return obj instanceof ObservableSet
}

/**
 * Detect MobX observable Map or Set.
 *
 * @param obj
 */
export function isObservableMapOrSet (obj) {
  return isObservableMap(obj) || isObservableSet(obj)
}