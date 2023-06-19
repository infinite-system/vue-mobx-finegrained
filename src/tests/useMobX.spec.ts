import { describe, it, beforeEach, expect, vi } from 'vitest'
// import { inject, injectable } from 'inversify'
// import { action, makeObservable, observable, computed, comparer } from 'mobX'
// import { AuthenticationRepository } from './Helpers/Authentication/AuthenticationRepository'
// import { MessagesPresenter } from './Helpers/Core/Messages/MessagesPresenter'
// import { MessagesRepository } from './Helpers/Core/Messages/MessagesRepository'
// import { Router } from './Helpers/Routing/Router'
// import { useMobX, notify } from '@/useMobX';
import { AppTestHarness } from './Helpers/AppTestHarness'
import { LoginRegisterPresenter } from "./Helpers/Authentication/LoginRegisterPresenter";
import { notify } from "../useMobX.js";
import { isReactive } from "vue";
import { ObservableMap, ObservableSet } from "mobx";

let appTestHarness = null
let presenter = null
let vm = null

function wait () {
  return setTimeout(() => {})
}

describe('------------------- MobX Reactivity ------------------', () => {

  beforeEach(() => {
    appTestHarness = new AppTestHarness()
    appTestHarness.init()
    presenter = appTestHarness.container.get(LoginRegisterPresenter)
    vm = presenter.vm
  })

  describe('mobX observable state propagation to vue', () => {

    describe('mobX change primitive', () => {

      it('mobX change string', () => {
        presenter._string = 'hello'
        expect(vm._string).toBe('hello')
      })

      it('mobX change boolean', () => {
        presenter._boolean = false
        expect(vm._boolean).toBe(false)
      })

      it('mobX change number', () => {
        presenter._number = 2
        expect(vm._number).toBe(2)
      })
    })

    describe('mobX change array', () => {

      describe('mobX change array at root', () => {

        it('mobX push to array root', () => {
          presenter._array.push(1)
          presenter._array.push(2)
          expect(vm._array[0]).toBe(1)
          expect(vm._array[1]).toBe(2)
        })

        it('mobX splice array at root', () => {
          presenter._arraySplice.splice(1, 0, 2)
          expect(vm._arraySplice[1]).toBe(2)
        })

        it('mobX unshift array at root', () => {
          presenter._arrayUnshift.unshift(0)
          expect(vm._arrayUnshift[0]).toBe(0)
        })

        it('mobX pop array at root', () => {
          presenter._arrayPop.pop()
          expect(vm._arrayPop[vm._arrayPop.length - 1]).toBe(1)
        })

        it('mobX shift array at root', () => {
          presenter._arrayShift.shift()
          expect(vm._arrayShift[0]).toBe(2)
        })
      })

      describe('mobX change deep nested array', () => {

        it('mobX push to nested array', () => {
          presenter._narray[0][0].push(1)
          presenter._narray[0][0].push(2)
          expect(vm._narray[0][0][0]).toBe(1)
          expect(vm._narray[0][0][1]).toBe(2)
        })

        it('mobX splice nested array', () => {
          presenter._narraySplice[0][0].splice(1, 0, 2)
          expect(vm._narraySplice[0][0][1]).toBe(2)
        })

        it('mobX unshift nested array', () => {
          presenter._narrayUnshift[0][0].unshift(0)
          expect(vm._narrayUnshift[0][0][0]).toBe(0)
        })

        it('mobX pop nested array', () => {
          presenter._narrayPop[0][0].pop()
          expect(vm._narrayPop[0][0][vm._narrayPop.length - 1]).toBe(1)
        })

        it('mobX shift nested array', () => {
          presenter._narrayShift[0][0].shift()
          expect(vm._narrayShift[0][0][0]).toBe(2)
        })
      })
    })

    describe('mobX change object', () => {

      describe('mobX change root props', () => {

        it('mobX add object prop to root', () => {
          presenter._object.prop = 1
          expect(vm._object.prop).toBe(1)
        })

        it('mobX update object prop at root', () => {
          presenter._objectUpdate.prop = 2
          expect(vm._objectUpdate.prop).toBe(2)
        })

        it('mobX delete object prop at root', () => {
          delete presenter._objectDelete.prop
          expect(vm._objectDelete.prop).toBeUndefined()
        })
      })

      describe('mobX change deep nested props', () => {

        it('mobX add nested object prop', () => {
          presenter._nobject.nest.nest.prop = 1
          expect(vm._nobject.nest.nest.prop).toBe(1)
        })

        it('mobX update nested object prop', () => {
          presenter._nobjectUpdate.nest.nest.prop = 2
          expect(vm._nobjectUpdate.nest.nest.prop).toBe(2)
        })

        it('mobX delete nested object prop', () => {
          delete presenter._nobjectDelete.nest.nest.prop
          expect(vm._nobjectDelete.nest.nest.prop).toBeUndefined()
        })
      })

    })

    describe('mobX object/array reassignment & maintain reactivity', () => {

      it('mobX reassign array at root', async () => {
        presenter._arrayReassign = [{ newProp: 1 }]
        expect(vm._arrayReassign[0].newProp).toBe(1)
        vm._arrayReassign[0].newProp = 2
        await wait()
        expect(presenter._arrayReassign[0].newProp).toBe(2)
      })

      it('mobX reassign whole observable object at root', async () => {
        presenter._objectReassign = { prop: { prop: true } }
        expect(vm._objectReassign.prop.prop).toBe(true)
        vm._objectReassign.prop.prop = false
        await wait()
        expect(presenter._objectReassign.prop.prop).toBe(false)
      })
    })
  })

  describe('mobX getter propagation', () => {

    describe('mobX getter propagation for array', () => {

      it('mobX push to array root', () => {
        presenter._getterArray.push({ prop: 1, prop2: 2 })
        expect(vm.getterArray[0].prop).toBe(1)
      })

      it('mobX change object in array', () => {
        presenter._getterNestedArray[0].prop = 3
        presenter._getterNestedArray[0].prop2 = 3
        expect(vm.getterNestedArray[0].prop).toBe(3)
        expect(vm.getterNestedArray[0].prop2).toBe(3)
      })

      it('mobX change nested object in array & notify manually', () => {
        presenter._getterNestedArray[0].prop3.prop = 4
        presenter._getterNestedArray[0].prop3 = notify(presenter._getterNestedArray[0].prop3)
        expect(vm.getterNestedArray[0].prop3.prop).toBe(4)
      })
    })

    describe('mobX getter propagation for object', () => {

      it('mobX add property to object', () => {
        presenter._getterObject.prop2 = 3
        expect(vm.getterObject.prop2).toBe(3)
      })

      it('mobX update property on nested object & notify manually', () => {
        presenter._getterNestedObject.prop3.prop = 3
        presenter._getterNestedObject = notify(presenter._getterNestedObject)
        expect(vm.getterNestedObject.prop3.prop).toBe(3)
      })
    })
  })

  describe('mobX Map/Set propagation', () => {

    describe('mobX Map propagation', () => {

      it('mobX set key & value into a Map', async () => {
        presenter.mapObject.set(1, 'foo')
        expect(vm.mapObject.get(1)).toBe('foo')
      })

      it('mobX delete from Map', () => {
        presenter.mapObject.set(1, 'foo')
        presenter.mapObject.delete(1)
        expect(vm.mapObject.get(1)).toBeUndefined()
      })
    })

    describe('mobX Set propagation', () => {

      it('mobX add to Set', async () => {
        const obj = { prop: 1, prop2: 2 }
        presenter.setObject.add(obj)
        vm.setObject.forEach(o => {
          expect(o).toEqual(obj)
        })
      })

      it('mobX delete from Set', () => {
        const obj = { prop: 1, prop2: 2 }
        presenter.setObject.add(obj)
        presenter.setObject.forEach(o => {
          presenter.setObject.delete(o)
        })

        let i = 0;
        vm.setObject.forEach(o => {
          i++
        })
        expect(i).toBe(0)
      })

    })

  })



  describe('mobx object/array reassignment & maintain reactivity', async () => {

    it('mobx reassign array at root', async () => {
      vm._arrayReassign = [{ newProp: 1 }]
      expect(vm._arrayReassign[0].newProp).toBe(1)
      vm._arrayReassign[0].newProp = 2
      expect(vm._arrayReassign[0].newProp).toBe(2)
    })

    it('vue reassign whole observable object at root', async () => {
      vm._objectReassign = { prop: { prop: true } }
      await wait()
      expect(vm._objectReassign.prop.prop).toBe(true)
      vm._objectReassign.prop.prop = false
      expect(vm._objectReassign.prop.prop).toBe(false)
    })

    it('vue reassign Map', async() => {
      vm.mapObject = new ObservableMap([[
        'prop', 1
      ]])
      await wait()
      expect(vm.mapObject.get('prop')).toBe(1)
      vm.mapObject.set('prop', 2)
      expect(vm.mapObject.get('prop')).toBe(2)
    })

    it('vue reassign Set', async() => {
      vm.setObject = new ObservableSet([1, 2])
      await wait()
      vm.setObject.add(3)
      let i = 0
      vm.setObject.forEach(el => {
        i++
        if (i === 3) {
          expect(el).toBe(3)
        }
      })
    })
  })


  it('--------------------- Vue Reactivity ---------------------', () => {})

  describe('vue state propagation to mobX', () => {

    describe('vue change primitive', () => {

      it('vue change string', async () => {
        vm._string = 'hello'
        await wait()
        expect(presenter._string).toBe('hello')
      })

      it('vue change boolean', async () => {
        vm._boolean = false
        await wait()
        expect(presenter._boolean).toBe(false)
      })

      it('vue change number', async () => {
        vm._number = 2
        await wait()
        expect(presenter._number).toBe(2)
      })
    })

    describe('vue change array', async () => {

      describe('vue change array at root', async () => {

        it('vue push to array root', async () => {
          vm._array.push(1)
          vm._array.push(2)
          await wait()
          expect(presenter._array[0]).toBe(1)
          expect(presenter._array[1]).toBe(2)
        })

        it('vue splice array at root', async () => {
          vm._arraySplice.splice(1, 0, 2)
          await wait()
          expect(presenter._arraySplice[1]).toBe(2)
        })

        it('vue unshift array at root', async () => {
          vm._arrayUnshift.unshift(0)
          await wait()
          expect(presenter._arrayUnshift[0]).toBe(0)
        })

        it('vue pop array at root', async () => {
          vm._arrayPop.pop()
          await wait()
          expect(presenter._arrayPop[presenter._arrayPop.length - 1]).toBe(1)
        })

        it('vue shift array at root', async () => {
          vm._arrayShift.shift()
          await wait()
          expect(presenter._arrayShift[0]).toBe(2)
        })
      })

      describe('vue change deep nested array', async () => {

        it('vue push to nested array', async () => {
          vm._narray[0][0].push(1)
          vm._narray[0][0].push(2)
          await wait()
          expect(presenter._narray[0][0][0]).toBe(1)
          expect(presenter._narray[0][0][1]).toBe(2)
        })

        it('vue splice nested array', async () => {
          vm._narraySplice[0][0].splice(1, 0, 2)
          await wait()
          expect(presenter._narraySplice[0][0][1]).toBe(2)
        })

        it('vue unshift nested array', async () => {
          vm._narrayUnshift[0][0].unshift(0)
          await wait()
          expect(presenter._narrayUnshift[0][0][0]).toBe(0)
        })

        it('vue pop nested array', async () => {
          vm._narrayPop[0][0].pop()
          await wait()
          expect(presenter._narrayPop[0][0][presenter._narrayPop.length - 1]).toBe(1)
        })

        it('vue shift nested array', async () => {
          vm._narrayShift[0][0].shift()
          await wait()
          expect(presenter._narrayShift[0][0][0]).toBe(2)
        })
      })
    })

    describe('vue change object', async () => {

      describe('vue change root props', async () => {

        it('vue add object prop to root', async () => {
          vm._object.prop = 1
          await wait()
          expect(presenter._object.prop).toBe(1)
        })

        it('vue update object prop at root', async () => {
          vm._objectUpdate.prop = 2
          await wait()
          expect(presenter._objectUpdate.prop).toBe(2)
        })

        it('vue delete object prop at root', async () => {
          delete vm._objectDelete.prop
          await wait()
          expect(presenter._objectDelete.prop).toBeUndefined()
        })
      })

      describe('vue change deep nested props', async () => {

        it('vue add nested object prop', async () => {
          vm._nobject.nest.nest.prop = 1
          await wait()
          expect(presenter._nobject.nest.nest.prop).toBe(1)
        })

        it('vue update nested object prop', async () => {
          vm._nobjectUpdate.nest.nest.prop = 2
          await wait()
          expect(presenter._nobjectUpdate.nest.nest.prop).toBe(2)
        })

        it('vue delete nested object prop', async () => {
          delete vm._nobjectDelete.nest.nest.prop
          await wait()
          expect(presenter._nobjectDelete.nest.nest.prop).toBeUndefined()
        })
      })
    })

    describe('vue object/array reassignment & maintain reactivity', async () => {

      it('vue reassign array at root', async () => {
        vm._arrayReassign = [{ newProp: 1 }]
        await wait()
        expect(presenter._arrayReassign[0].newProp).toBe(1)
        presenter._arrayReassign[0].newProp = 2
        expect(vm._arrayReassign[0].newProp).toBe(2)
      })

      it('vue reassign whole observable object at root', async () => {
        vm._objectReassign = { prop: { prop: true } }
        await wait()
        expect(presenter._objectReassign.prop.prop).toBe(true)
        presenter._objectReassign.prop.prop = false
        expect(vm._objectReassign.prop.prop).toBe(false)
      })

      it('vue reassign Map', async() => {
        vm.mapObject = new ObservableMap([[
          'prop', 1
        ]])
        await wait()
        expect(presenter.mapObject.get('prop')).toBe(1)
        presenter.mapObject.set('prop', 2)
        expect(vm.mapObject.get('prop')).toBe(2)
      })

      it('vue reassign Set', async() => {
        vm.setObject = new ObservableSet([1, 2])
        await wait()
        presenter.setObject.add(3)
        let i = 0
        presenter.setObject.forEach(el => {
          i++
          if (i === 3) {
            expect(el).toBe(3)
          }
        })
      })
    })

    describe('vue Map/Set propagation', () => {
      describe('vue Map propagation', () => {

        it('vue add to Map', async () => {
          const obj = { prop: 1, prop2: 2 }
          vm.mapObject.set(1, 'bar')
          expect(presenter.mapObject.get(1)).toBe('bar')
          presenter.mapObject.set(1, 'foo')
          expect(vm.mapObject.get(1)).toBe('foo')
          expect(isReactive(vm.mapObject)).toBe(true)
        })

        it('vue delete from Map', async () => {
          vm.mapObject.set(1, 'foo')
          vm.mapObject.delete(1)
          expect(presenter.mapObject.get(1)).toBeUndefined()
        })

      })

      describe('vue Set propagation', () => {

        it('vue add to Set', async () => {
          const obj = { prop: 1, prop2: 2 }
          vm.setObject.add(obj)
          presenter.setObject.forEach(o => {
            expect(o).toEqual(obj)
          })
        })

        it('vue delete from Set', () => {
          const obj = { prop: 1, prop2: 2 }
          vm.setObject.add(obj)
          vm.setObject.forEach(o => {
            vm.setObject.delete(o)
          })

          let i = 0;
          presenter.setObject.forEach(o => {
            i++
          })
          expect(i).toBe(0)
        })
      })
    })


  })
})
