import { describe, it, beforeEach, expect, vi } from 'vitest'
import { AppTestHarness } from './Helpers/AppTestHarness'
import { TestPresenter } from "./Helpers/Authentication/TestPresenter.js";
import { TestPresenterAuto } from "./Helpers/Authentication/TestPresenterAuto.js";
import { notify } from "../useMobX.js";
import { isReactive } from "vue";
import { ObservableMap, ObservableSet } from "mobx";

let appTestHarness = null
let presenter = null
let vm = null

function wait () {
  return setTimeout(() => {})
}

function test (presenterClass, mode = 'manual') {

  describe('----- mode: ' + mode + '----', () => {

    beforeEach(() => {
      appTestHarness = new AppTestHarness()
      appTestHarness.init()
      presenter = appTestHarness.container.get(presenterClass)
      vm = presenter.vm
    })

    describe('------------------- Object Shadowing ------------------', () => {

      if (mode === 'manual') {

        it('parent non-observed properties are accessible', () => {
          expect(vm.nonObservedProp).toBe('test')
        })

        it('parent observed properties are accessible', () => {
          expect(vm.showValidationWarning).toBe(false)
        })

        it('presenter observed properties accessible', () => {
          expect(vm.email).toBe('test@test.ca')
        })

        it('grandparent properties are accessible', () => {
          expect(vm.grandParentProp).toBe(1)
        })


      }


      it('presenter non-observed properties accessible', () => {
        expect(vm.nonObservablePrimitive).toBe(1)
      })

      it('presenter non-observed simple properties reassignable', () => {
        vm.nonObservablePrimitive = 2
        expect(presenter.nonObservablePrimitive).toBe(2)
      })

      it('presenter non-observed object properties reassignable', () => {
        vm.nonObservableObject = { test: 1 }
        expect(presenter.nonObservableObject.test).toBe(1)
      })

      it('vm non-observed object properties are reassignable', () => {
        presenter.nonObservableObject = { test: 1 }
        expect(vm.nonObservableObject.test).toBe(1)
      })

      it('presenter non-observed object sub-properties are reassignable', () => {
        vm.nonObservableObject.prop.prop.prop = 3
        expect(presenter.nonObservableObject.prop.prop.prop).toBe(3)
      })

      it('presenter non-observed object sub-properties are reassignable', () => {
        vm.nonObservableObject.prop.prop.prop = 3
        expect(presenter.nonObservableObject.prop.prop.prop).toBe(3)
      })
    })

    describe('------------------- MobX Reactivity ------------------', () => {

      describe('mobX observable state propagation to vue', () => {

        describe('mobX change primitive', () => {

          it('mobX change string', () => {
            presenter.string = 'hello'
            expect(vm.string).toBe('hello')
          })

          it('mobX change boolean', () => {
            presenter.boolean = false
            expect(vm.boolean).toBe(false)
          })

          it('mobX change number', () => {
            presenter.number = 2
            expect(vm.number).toBe(2)
          })
        })

        describe('mobX change array', () => {

          describe('mobX change array at root', () => {

            it('mobX push to array root', () => {
              presenter.array.push(1)
              presenter.array.push(2)
              expect(vm.array[0]).toBe(1)
              expect(vm.array[1]).toBe(2)
            })

            it('mobX splice array at root', () => {
              presenter.arraySplice.splice(1, 0, 2)
              expect(vm.arraySplice[1]).toBe(2)
            })

            it('mobX unshift array at root', () => {
              presenter.arrayUnshift.unshift(0)
              expect(vm.arrayUnshift[0]).toBe(0)
            })

            it('mobX pop array at root', () => {
              presenter.arrayPop.pop()
              expect(vm.arrayPop[vm.arrayPop.length - 1]).toBe(1)
            })

            it('mobX shift array at root', () => {
              presenter.arrayShift.shift()
              expect(vm.arrayShift[0]).toBe(2)
            })
          })

          describe('mobX change deep nested array', () => {

            it('mobX push to nested array', () => {
              presenter.arrayNested[0][0].push(1)
              presenter.arrayNested[0][0].push(2)
              expect(vm.arrayNested[0][0][0]).toBe(1)
              expect(vm.arrayNested[0][0][1]).toBe(2)
            })

            it('mobX splice nested array', () => {
              presenter.arrayNestedSplice[0][0].splice(1, 0, 2)
              expect(vm.arrayNestedSplice[0][0][1]).toBe(2)
            })

            it('mobX unshift nested array', () => {
              presenter.arrayNestedUnshift[0][0].unshift(0)
              expect(vm.arrayNestedUnshift[0][0][0]).toBe(0)
            })

            it('mobX pop nested array', () => {
              presenter.arrayNestedPop[0][0].pop()
              expect(vm.arrayNestedPop[0][0][vm.arrayNestedPop.length - 1]).toBe(1)
            })

            it('mobX shift nested array', () => {
              presenter.arrayNestedShift[0][0].shift()
              expect(vm.arrayNestedShift[0][0][0]).toBe(2)
            })


            it('mobX splice delete from nested array and add another element', () => {
              presenter.arrayNestedShift[0].splice(0, 1)
              presenter.arrayNestedShift[0].push([2, 3])
              expect(presenter.arrayNestedShift[0]).toEqual([[2, 3]])
            })

            it('mobX splice delete from nested array after pushing twice', () => {
              presenter.arrayNestedShift[0].push([2, 3])
              presenter.arrayNestedShift[0].push([4, 5])
              presenter.arrayNestedShift[0].splice(0, 1)
              expect(vm.arrayNestedShift[0]).toEqual([[2, 3], [4, 5]])
            })

            it('mobX splice delete 2 items from nested array after pushing twice', () => {
              presenter.arrayNestedShift[0].push([2, 3])
              presenter.arrayNestedShift[0].push([4, 5])
              presenter.arrayNestedShift[0].splice(0, 2)
              expect(vm.arrayNestedShift[0]).toEqual([[4, 5]])
            })

            it('mobX splice delete 2 items from nested array after pushing twice and insert another array', () => {
              presenter.arrayNestedShift[0].push([2, 3])
              presenter.arrayNestedShift[0].push([4, 5])
              presenter.arrayNestedShift[0].splice(0, 2, [7, 8])
              expect(vm.arrayNestedShift[0]).toEqual([[7, 8], [4, 5]])
            })

            it('mobX splice delete 2 items from nested array after pushing twice and insert object', () => {
              presenter.arrayNestedShift[0].push([2, 3])
              presenter.arrayNestedShift[0].push([4, 5])
              presenter.arrayNestedShift[0].splice(0, 2, { test: { test: 1 } })
              expect(vm.arrayNestedShift[0]).toEqual([{ test: { test: 1 } }, [4, 5]])
            })
          })
        })

        describe('mobX change object', () => {

          describe('mobX change root props', () => {

            it('mobX add object prop to root', () => {
              presenter.object.prop = 1
              expect(vm.object.prop).toBe(1)
            })

            it('mobX update object prop at root', () => {
              presenter.objectUpdate.prop = 2
              expect(vm.objectUpdate.prop).toBe(2)
            })

            it('mobX delete object prop at root', () => {
              delete presenter.objectDelete.prop
              expect(vm.objectDelete.prop).toBeUndefined()
            })
          })

          describe('mobX change deep nested props', () => {

            it('mobX add nested object prop', () => {
              presenter.objectNested.nest.nest.prop = 1
              expect(vm.objectNested.nest.nest.prop).toBe(1)
            })

            it('mobX update nested object prop', () => {
              presenter.objectNestedUpdate.nest.nest.prop = 2
              expect(vm.objectNestedUpdate.nest.nest.prop).toBe(2)
            })

            it('mobX delete nested object prop', () => {
              delete presenter.objectNestedDelete.nest.nest.prop
              expect(vm.objectNestedDelete.nest.nest.prop).toBeUndefined()
            })
          })

        })

        describe('mobX object/array reassignment & maintain reactivity', () => {

          it('mobX reassign array at root', async () => {
            presenter.arrayReassign = [{ newProp: 1 }]
            expect(vm.arrayReassign[0].newProp).toBe(1)
            vm.arrayReassign[0].newProp = 2

            expect(presenter.arrayReassign[0].newProp).toBe(2)
          })

          it('mobX reassign whole observable object at root', async () => {
            presenter.objectReassign = { prop: { prop: true } }
            expect(vm.objectReassign.prop.prop).toBe(true)
            vm.objectReassign.prop.prop = false

            expect(presenter.objectReassign.prop.prop).toBe(false)
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
            presenter._getterObject = notify(presenter._getterObject)
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
          presenter.arrayReassign = [{ newProp: 1 }]
          expect(vm.arrayReassign[0].newProp).toBe(1)

          vm.arrayReassign[0].newProp = 2
          expect(vm.arrayReassign[0].newProp).toBe(2)
        })

        it('mobx reassign whole observable object at root', async () => {
          presenter.objectReassign = { prop: { prop: true } }
          expect(vm.objectReassign.prop.prop).toBe(true)

          vm.objectReassign.prop.prop = false
          expect(vm.objectReassign.prop.prop).toBe(false)
        })

        it('mobx reassign Map', async () => {
          presenter.mapObject = new Map()
          presenter.mapObject.set('prop', 1)
          expect(vm.mapObject.get('prop')).toBe(1)

          vm.mapObject.set('prop', 2)

          expect(presenter.mapObject.get('prop')).toBe(2)
        })

        it('mobx reassign Set', async () => {
          presenter.setObject = new Set()
          presenter.setObject.add(1)
          presenter.setObject.add(2)
          presenter.setObject.add(3)

          let i = 0, value

          const iterator = vm.setObject.entries();
          for (const entry of iterator) {
            i++
            value = entry
          }
          expect(i).toBe(3)
          expect(value[0]).toBe(3)

        })
      })


      it('--------------------- Vue Reactivity ---------------------', () => {})

      describe('vue state propagation to mobX', () => {

        describe('vue change primitive', () => {

          it('vue change string', async () => {
            vm.string = 'hello'

            expect(presenter.string).toBe('hello')
          })

          it('vue change boolean', async () => {
            vm.boolean = false

            expect(presenter.boolean).toBe(false)
          })

          it('vue change number', async () => {
            vm.number = 2

            expect(presenter.number).toBe(2)
          })
        })

        describe('vue change array', async () => {

          describe('vue change array at root', async () => {

            it('vue push to array root', async () => {
              vm.array.push(1)
              vm.array.push(2)

              expect(presenter.array[0]).toBe(1)
              expect(presenter.array[1]).toBe(2)
            })

            it('vue splice array at root', async () => {
              vm.arraySplice.splice(1, 0, 2)

              expect(presenter.arraySplice[1]).toBe(2)
            })

            it('vue unshift array at root', async () => {
              vm.arrayUnshift.unshift(0)

              expect(presenter.arrayUnshift[0]).toBe(0)
            })

            it('vue pop array at root', async () => {
              vm.arrayPop.pop()

              expect(presenter.arrayPop[presenter.arrayPop.length - 1]).toBe(1)
            })

            it('vue shift array at root', async () => {
              vm.arrayShift.shift()

              expect(presenter.arrayShift[0]).toBe(2)
            })
          })

          describe('vue change deep nested array', async () => {

            it('vue push to nested array', async () => {
              vm.arrayNested[0][0].push(1)
              vm.arrayNested[0][0].push(2)

              expect(presenter.arrayNested[0][0][0]).toBe(1)
              expect(presenter.arrayNested[0][0][1]).toBe(2)
            })

            it('vue splice nested array', async () => {
              vm.arrayNestedSplice[0][0].splice(1, 0, 2)

              expect(presenter.arrayNestedSplice[0][0][1]).toBe(2)
            })

            it('vue unshift nested array', async () => {
              vm.arrayNestedUnshift[0][0].unshift(0)

              expect(presenter.arrayNestedUnshift[0][0][0]).toBe(0)
            })

            it('vue pop nested array', async () => {
              vm.arrayNestedPop[0][0].pop()

              expect(presenter.arrayNestedPop[0][0][presenter.arrayNestedPop.length - 1]).toBe(1)
            })

            it('vue shift nested array', async () => {
              vm.arrayNestedShift[0][0].shift()

              expect(presenter.arrayNestedShift[0][0][0]).toBe(2)
            })


            it('vue splice delete from nested array', () => {
              vm.arrayNestedShift[0].splice(0, 1)

              expect(presenter.arrayNestedShift[0]).toEqual([])
            })

            it('vue splice delete from nested array and add another element', () => {
              vm.arrayNestedShift[0].splice(0, 1)
              vm.arrayNestedShift[0].push([3, 4])

              expect(presenter.arrayNestedShift[0]).toEqual([[3, 4]])
            })

            it('vue splice delete from nested array after pushing twice', () => {
              vm.arrayNestedShift[0].push([3, 4])
              vm.arrayNestedShift[0].push([5, 6])
              vm.arrayNestedShift[0].splice(0, 1)

              expect(presenter.arrayNestedShift[0]).toEqual([[3, 4], [5, 6]])
            })

            it('vue splice delete 2 items from nested array after pushing twice and insert another array', () => {
              vm.arrayNestedShift[0].push([2, 3])
              vm.arrayNestedShift[0].push([4, 5])
              vm.arrayNestedShift[0].splice(0, 2, [7, 8])

              expect(presenter.arrayNestedShift[0]).toEqual([[7, 8], [4, 5]])
            })

            it('vue splice delete 2 items from nested array after pushing twice and insert object', () => {
              vm.arrayNestedShift[0].push([2, 3])
              vm.arrayNestedShift[0].push([4, 5])
              vm.arrayNestedShift[0].splice(0, 2, { test: { test: 1 } })

              expect(presenter.arrayNestedShift[0]).toEqual([{ test: { test: 1 } }, [4, 5]])
            })
          })
        })

        describe('vue change object', async () => {

          describe('vue change root props', async () => {

            it('vue add object prop to root', async () => {
              vm.object.prop = 1

              expect(presenter.object.prop).toBe(1)
            })

            it('vue update object prop at root', async () => {
              vm.objectUpdate.prop = 2

              expect(presenter.objectUpdate.prop).toBe(2)
            })

            it('vue delete object prop at root', async () => {
              delete vm.objectDelete.prop

              expect(presenter.objectDelete.prop).toBeUndefined()
            })
          })

          describe('vue change deep nested props', async () => {

            it('vue add nested object prop', async () => {
              vm.objectNested.nest.nest.prop = 1

              expect(presenter.objectNested.nest.nest.prop).toBe(1)
            })

            it('vue update nested object prop', async () => {
              vm.objectNestedUpdate.nest.nest.prop = 2

              expect(presenter.objectNestedUpdate.nest.nest.prop).toBe(2)
            })

            it('vue delete nested object prop', async () => {
              delete vm.objectNestedDelete.nest.nest.prop

              expect(presenter.objectNestedDelete.nest.nest.prop).toBeUndefined()
            })
          })
        })

        describe('vue object/array reassignment & maintain reactivity', async () => {

          it('vue reassign array at root', async () => {
            vm.arrayReassign = [{ newProp: 1 }]

            expect(presenter.arrayReassign[0].newProp).toBe(1)
            presenter.arrayReassign[0].newProp = 2
            expect(vm.arrayReassign[0].newProp).toBe(2)
          })

          it('vue reassign whole observable object at root', async () => {
            vm.objectReassign = { prop: { prop: true } }

            expect(presenter.objectReassign.prop.prop).toBe(true)

            presenter.objectReassign.prop.prop = false
            expect(vm.objectReassign.prop.prop).toBe(false)
          })

          it('vue reassign Map', async () => {
            vm.mapObject = new Map([[
              'prop', 5
            ]])

            expect(presenter.mapObject.get('prop')).toBe(5)

            presenter.mapObject.set('prop', 2)
            expect(vm.mapObject.get('prop')).toBe(2)
          })

          it('vue reassign Set', async () => {
            vm.setObject = new Set([1, 2])

            presenter.setObject.add(3)
            let i = 0
            presenter.setObject.forEach(el => {
              i++
              if (i === 3) {
                expect(el).toBe(3)
              }
            })

            let j = 0;
            vm.setObject.forEach(el => {
              j++
              if (j === 3) {
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
              expect(isReactive(vm.mapObject)).toBe(true)

              expect(presenter.mapObject.get(1)).toBe('foo')
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
  })
}

test(TestPresenter, 'manual')
test(TestPresenterAuto, 'auto')
