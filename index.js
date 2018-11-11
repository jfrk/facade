const decurry = require('decurry')

// const arrayTraps = elementTraps => ({
//   get(target, prop, wrapper) {
//     // Handle indexes
//     if (
//       typeof prop === 'number' ||
//       Number.isInteger(Number(prop))
//     ) {
//       return new Proxy(
//         Reflect.get(target, prop, wrapper),
//         elementTraps,
//       )
//     }
//     // TODO: Add own traps (props and methods on the array)
//     return Reflect.get(target, prop, wrapper)
//   },
//   // set(target, prop, wrapper) {
//   //   if (
//   //     typeof prop === 'number' ||
//   //     Number.isInteger(Number(prop))
//   //   ) {
//   //     Reflect.set(target, prop, wrapper)
//   //   }
//   //   Reflect.set(target, prop, wrapper)
//   // },
// })

// const wrapArray = ({ spec }) => array => {
//   let elementTraps = {
//     get(target, prop, wrapper) {
//       let descriptor = Object.getOwnPropertyDescriptor(
//         spec,
//         prop,
//       )
//       if (!descriptor) {
//         return Reflect.get(target, prop, wrapper)
//       }
//       return Reflect.get(spec, prop, wrapper)
//     },
//   }
//   return new Proxy(array, arrayTraps(elementTraps))
// }

// const wrapObject = (spec, types = {}) => target => {
//   let traps = {
//     get(target, prop, wrapper) {
//       let descriptor = Object.getOwnPropertyDescriptor(
//         spec,
//         prop,
//       )
//       // If no specification for this prop, just get it directly from the target.
//       if (!descriptor) {
//         return Reflect.get(target, prop, wrapper)
//       }
//       // If the spec has a getter for this prop, call it
//       if (descriptor.get) {
//         // Gets the prop from the spec with Reflect so that `this` will be the wrapper
//         return Reflect.get(spec, prop, wrapper)
//       }
//       // If the spec has a function as the value for this prop, return it
//       if (
//         descriptor.value &&
//         descriptor.value instanceof Function
//       ) {
//         return Reflect.get(spec, prop, wrapper)
//       }
//       if (
//         descriptor.value &&
//         typeof descriptor.value === 'string'
//       ) {
//         // TODO: Handle typerefs
//         let type = types[descriptor.value]
//         if (type) {
//           return wrapObject(type, types)(
//             Reflect.get(target, prop, wrapper),
//           )
//         }
//       }
//     },
//     set(target, prop, value, wrapper) {
//       let descriptor = Object.getOwnPropertyDescriptor(
//         spec,
//         prop,
//       )
//       if (descriptor && descriptor.set) {
//         return Reflect.set(spec, prop, value, wrapper)
//       }
//       return Reflect.set(target, prop, value, wrapper)
//     },
//   }
//   return new Proxy(target, traps)
// }

const INDEX = Symbol('numericalIndex')
const ROOT = Symbol('rootObject')
const PARENT = Symbol('parentObject')
const TYPE = Symbol('type')

const getPropDescriptor = (spec, prop) => {
  let descriptor = Object.getOwnPropertyDescriptor(
    spec,
    prop,
  )
  // If the prop is an integer and no explicit spec for that prop is specified, look for the generig symbol INDEX and use that one instead. This is primarily for arrays.
  if (
    !descriptor &&
    (typeof prop === 'number' ||
      Number.isInteger(Number(prop)))
  ) {
    descriptor = Object.getOwnPropertyDescriptor(
      spec,
      INDEX,
    )
  }
  return descriptor
}

/**
 * @param types
 * @param rootType
 * @param rootObject
 */
const wrap = decurry(3, types => {
  const wrapObject = type => (
    target,
    parent,
    rootObject,
  ) => {
    let spec = types[type]
    if (!spec) {
      throw new Error(`Type ${type} does not exist.`)
    }
    // if (typeof target !== 'object') {
    //   return target
    // }
    let traps = {
      get(target, prop, wrapper) {
        if (prop === ROOT) {
          return rootObject || parent || wrapper
        }
        if (prop === PARENT) {
          return parent
        }
        if (prop === TYPE) {
          return type
        }
        let descriptor = getPropDescriptor(spec, prop)
        // If no specification for this prop, just get it directly from the target.
        if (
          !descriptor ||
          (!descriptor.writable && !descriptor.configurable)
        ) {
          return Reflect.get(target, prop, wrapper)
        }
        let targetDescriptor = Object.getOwnPropertyDescriptor(
          target,
          prop,
        )
        if (
          targetDescriptor &&
          (!targetDescriptor.writable &&
            !targetDescriptor.configurable)
        ) {
          return Reflect.get(target, prop, wrapper)
        }
        // If the spec has a getter for this prop, call it
        if (descriptor.get) {
          // Gets the prop from the spec with Reflect so that `this` will be the wrapper
          return Reflect.get(spec, prop, wrapper)
        }
        // If the spec has a function as the value for this prop, return it
        if (
          descriptor.value &&
          descriptor.value instanceof Function
        ) {
          return Reflect.get(spec, prop, wrapper)
        }
        if (
          descriptor.value &&
          typeof descriptor.value === 'string'
        ) {
          return wrapObject(descriptor.value)(
            Reflect.get(target, prop, wrapper),
            wrapper,
            rootObject || wrapper,
          )
        }
      },

      set(target, prop, value, wrapper) {
        let descriptor = getPropDescriptor(spec, prop)
        if (descriptor && descriptor.set) {
          return Reflect.set(spec, prop, value, wrapper)
        }
        return Reflect.set(target, prop, value, wrapper)
      },
    }
    return new Proxy(target, traps)
  }
  return wrapObject
})

module.exports = wrap

Object.assign(module.exports, {
  wrap,
  // wrapArray,
  // wrapObject,
  INDEX,
  ROOT,
  PARENT,
  TYPE,
})
