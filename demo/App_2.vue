<script setup lang="ts">
import { onMounted, reactive, ref, watch, getCurrentInstance, nextTick } from 'vue'
import { container } from '@/tests/Helpers/AppIOC'
import { TestPresenterAuto } from "../src/tests/Helpers/Authentication/TestPresenterAuto.js";
import { TestPresenter } from "../src/tests/Helpers/Authentication/TestPresenter.js";
import { TestVue } from "../src/tests/Helpers/Authentication/TestVue.js";
import { deepClone } from '../src/utils'

function _ (arr) {
  return JSON.stringify(arr)
}

const trying = reactive({
  test: ref('hello')
})

const pres = container.get(TestVue)

const presenter: TestPresenter = container.get(TestPresenter)
const presenter2: TestPresenterAuto = container.get(TestPresenterAuto)

const vm: TestPresenter = presenter.vm
const vm2: TestPresenterAuto = presenter2.vm

const defaults = deepClone(presenter)

setTimeout(() => {
  console.log(presenter.hugeArray[20].struct.user)

  presenter2.nonObservablePrimitive = 444
  console.log('vm.nonObservablePrimitive', vm2.nonObservablePrimitive)

  presenter.arrayNestedSplice[0][0][1] = undefined

  vm.arrayNestedSplice[0][0][2] = 5

  delete vm.objectNested.nest.nest

  presenter._hugeArray[20].struct.user = 1
  presenter._hugeArray.push({ test: 'hola' })
  // alert(presenter.hugeArray[22].test)
}, 500)

// setInterval(() => {

// presenter._hugeArray.push({ test: 'hola' })
// }, 1000)
let $refs
const checks = {}

function check (name, result) {
  return setTimeout(() => {
    nextTick(() => {
      if (!(name in checks)) {
        const dom = $refs['result_' + name]
        const domBtn = $refs['btn_' + name]
        const resultDom = dom.innerText
        if (resultDom === result) {
          domBtn.classList.add('pass')
        }
        else {
          domBtn.classList.add('fail')
        }
        checks[name] = true
      }
    })
  })
}

function reset (obj, name) {
  obj[name] = defaults[name]
}
setTimeout(() => {
  presenter.authRepo.reactiveVar = reactive([])
  presenter.nonObservableObject.prop.prop.prop = {test:1}
}, 500)
setTimeout(() => {

  vm.nonObservableObject.prop.prop.prop.test = 4

  // alert(vm.nonObservableObject.prop.prop.prop.test === presenter.nonObservableObject.prop.prop.prop.test)

  presenter.setReactiveVar()
}, 1500)
onMounted(() => {
  $refs = getCurrentInstance().ctx.$refs
  console.log($refs)
})

vm.email = 1

setInterval(() => {
  // vm.email++
})
</script>

<template>
{{vm.email}}
<!--  <vue-dd v-model="trying" />-->
<!--  <vue-dd v-model="pres" />-->

  <button @click="pres.setReactiveVar()">Set Reactive Var</button>

  {{ pres.authRepo.reactiveVar }}
  {{ pres.reactiveVar }}



  <br />
  <br />
  <br />
  <br />
  <br />
  <button @click="presenter.setReactiveVar()">Set Reactive Var</button>

  {{ vm.authRepo.reactiveVar }}
  {{ vm.reactiveVar }}

  <div v-for="el in vm.reactiveVar">
    <input v-model="el.test" />
  </div>
  <div class="body">
    <h1>vue-mobx-finegrained</h1>

    <!--    <vue-dd v-model="presenter" />-->
<!--    <vue-dd v-model="vm" />-->


    {{ vm.nonObservableObject.prop.prop.prop }}
    <div class="section">
      <h2>Observable Arrays</h2>

      <h3>Root Array</h3>
      <div style="display:flex">

        <div style="flex-basis: 50%;">
          <h4>presenter to vm sync:</h4>

          <button ref="btn_presenterArrayPush" @click="() => {
            reset(presenter, 'array')
            presenter.array.push(2)
            check('presenterArrayPush', '[2]')
          }">push
          </button>
          <span ref="result_presenterArrayPush">{{ _(vm.array) }}</span><br />

          <button ref="btn_presenterArrayPop" @click="() => {
            reset(presenter, 'arrayPop')
            presenter.arrayPop.pop()
            check('presenterArrayPop', '[1]')
          }">pop
          </button>
          <span ref="result_presenterArrayPop">{{ _(vm.arrayPop) }}</span><br />

          <button ref="btn_presenterArrayShift" @click="() => {
            reset(presenter, 'arrayShift')
            presenter.arrayShift.shift()
            check('presenterArrayShift', '[2]')
          }">shift
          </button>
          <span ref="result_presenterArrayShift">{{ _(vm.arrayShift) }}</span><br />

          <button ref="btn_presenterArrayUnshift" @click="() => {
            reset(presenter, 'arrayUnshift')
            presenter.arrayUnshift.unshift(3)
            check('presenterArrayUnshift', '[3,1,2]')
          }">unshift
          </button>
          <span ref="result_presenterArrayUnshift">{{ _(vm.arrayUnshift) }}</span><br />

          <button ref="btn_presenterArraySplice" @click="() => {
            reset(presenter, 'arraySplice')
            presenter.arraySplice.splice(1, 0, 2)
            check('presenterArraySplice', '[1,2,3,5]')
          }">splice add single
          </button>
          <span ref="result_presenterArraySplice">{{ _(vm.arraySplice) }}</span><br />

          <button ref="btn_presenterArraySpliceMultiple" @click="() => {
            reset(presenter, 'arraySplice')
            presenter.arraySplice.splice(1, 0, 4, 5)
            check('presenterArraySpliceMultiple', '[1,4,5,3,5]')
          }">splice add multiple
          </button>
          <span ref="result_presenterArraySpliceMultiple">{{ _(vm.arraySplice) }}</span><br />

          <button ref="btn_presenterArraySpliceAddArray" @click="() => {
            reset(presenter, 'arraySplice')
            presenter.arraySplice.splice(1, 0, [7, 8])
            check('presenterArraySpliceAddArray', '[1,[7,8],3,5]')
          }">splice add array
          </button>
          <span ref="result_presenterArraySpliceAddArray">{{ _(vm.arraySplice) }}</span><br />

          <button ref="btn_presenterArraySpliceDelete" @click="() => {
            reset(presenter, 'arraySplice')
            presenter.arraySplice.splice(1, 1)
            check('presenterArraySpliceDelete', '[1,5]')
          }">splice delete single
          </button>
          <span ref="result_presenterArraySpliceDelete">{{ _(vm.arraySplice) }}</span><br />
        </div>
        <div>
          <h4>vm to presenter sync:</h4>

          <button ref="btn_vmArrayPush" @click="() => {
            reset(vm, 'array')
            vm.array.push(2);
            $refs.result_vmArrayPush.innerHTML = _(vm.array)
            check('vmArrayPush', '[2]')
          }">push
          </button>
          <span ref="result_vmArrayPush"></span><br />

          <button @click="() => {
            vm.arrayPop.pop();
            $refs.vmArrayPop.innerHTML = _(vm.arrayPop)
          }">pop
          </button>
          <span ref="vmArrayPop"></span><br />

          <button @click="() => {
            vm.arrayShift.shift()
            $refs.vmArrayShift.innerHTML = _(vm.arrayShift)
          }">shift
          </button>
          <span ref="vmArrayShift"></span><br />

          <button @click="() => {
            vm.arrayUnshift.unshift(3)
            $refs.vmArrayUnshift.innerHTML = _(vm.arrayUnshift)
          }">unshift
          </button>
          <span ref="vmArrayUnshift"></span><br />

          <button @click="() => {
        vm.arraySplice.splice(1, 0, 2)
        $refs.vmArraySplice.innerHTML = _(vm.arraySplice)
      }">splice add single
          </button>
          <span ref="vmArraySplice"></span><br />

          <button ref="buttons.10" @click="() => {
        vm.arraySplice.splice(1, 0, 4, 5)
        $refs.vmArraySpliceMultiple.innerHTML = _(vm.arraySplice)
      }">splice add multiple
          </button>
          <span ref="vmArraySpliceMultiple"></span><br />

          <button @click="() => {
        vm.arraySplice.splice(1, 0, [7, 8])
        $refs.vmArraySpliceMultipleArray.innerHTML = _(vm.arraySplice)
      }">splice add another array
          </button>
          <span ref="vmArraySpliceMultipleArray"></span><br />

          <button @click="() => {
        vm.arraySplice.splice(1, 1)
        $refs.vmArraySpliceDelete.innerHTML = _(vm.arraySplice)
      }">splice delete single
          </button>
          <span ref="vmArraySpliceDelete"></span><br />
        </div>


      </div>

      <h2>Nested Array</h2>
      <div style="display:flex">

        <div style="flex-basis: 50%;">

          <h4>presenter to vm sync:</h4>

          <button @click="() => {
            presenter.arrayNested[0][0].push(2)
          }">push
          </button>
          <span id="presenterArrayNestedPush">{{ vm.arrayNested }}</span><br />

          <button @click="() => {
            presenter.arrayNestedPop[0][0].pop()
          }">pop
          </button>
          <span id="presenterArrayNestedPop">{{ vm.arrayNestedPop }}</span><br />

          <button @click="() => {
            presenter.arrayNestedShift[0][0].shift()
          }">shift
          </button>
          <span id="presenterArrayNestedShift">{{ vm.arrayNestedShift }}</span><br />

          <button @click="() => {
            presenter.arrayNestedUnshift[0][0].unshift(3)
          }">unshift
          </button>
          <span id="presenterArrayNestedUnshift">{{ vm.arrayNestedUnshift }}</span><br />

          <button @click="() => {
            presenter.arrayNestedSplice[0][0].splice(1, 0, 2)
          }">splice add single
          </button>
          <span id="presenterArrayNestedSplice">{{ vm.arrayNestedSplice }}</span><br />

          <button @click="() => {
            presenter.arrayNestedSplice[0][0].splice(1, 0, 4, 5)
          }">splice add multiple
          </button>
          <span id="presenterArrayNestedSpliceMultiple">{{ vm.arrayNestedSplice }}</span><br />

          <button @click="() => {
            presenter.arrayNestedSplice[0][0].splice(1, 0, [7, 8])
          }">splice add another array
          </button>
          <span id="presenterArrayNestedSpliceAddArray">{{ vm.arrayNestedSplice }}</span><br />

        </div>
        <div>
          <h4>vm to presenter sync:</h4>

          <button @click="() => {
        vm.arrayNested[0][0].push(2);
        $refs.vmArrayNestedPush.innerHTML = _(vm.arrayNested)
      }">push
          </button>
          <span ref="vmArrayNestedPush"></span><br />

          <button @click="() => {
        vm.arrayNestedPop[0][0].pop();
        $refs.vmArrayNestedPop.innerHTML = _(vm.arrayNestedPop)
      }">pop
          </button>
          <span ref="vmArrayNestedPop"></span><br />

          <button @click="() => {
        vm.arrayNestedShift[0][0].shift()
        $refs.vmArrayNestedShift.innerHTML = _(vm.arrayNestedShift)
      }">shift
          </button>
          <span ref="vmArrayNestedShift"></span><br />

          <button @click="() => {
        vm.arrayNestedUnshift[0][0].unshift(3)
        $refs.vmArrayNestedUnshift.innerHTML = _(vm.arrayNestedUnshift)
      }">unshift
          </button>
          <span ref="vmArrayNestedUnshift"></span><br />

          <button @click="() => {
        vm.arrayNestedSplice[0][0].splice(1, 0, 2)
        $refs.vmArrayNestedSplice.innerHTML = _(vm.arrayNestedSplice)
      }">splice add single
          </button>
          <span ref="vmArrayNestedSplice"></span><br />

          <button ref="buttons.10" @click="() => {
        vm.arrayNestedSplice[0][0].splice(1, 0, 4, 5)
        $refs.vmArrayNestedSpliceMultiple.innerHTML = _(vm.arrayNestedSplice)
      }">splice add multiple
          </button>
          <span ref="vmArrayNestedSpliceMultiple"></span><br />

          <button @click="() => {
        vm.arrayNestedSplice[0][0].splice(1, 0, [7, 8])
        $refs.vmArrayNestedSpliceMultipleArray.innerHTML = _(vm.arrayNestedSplice)
      }">splice add another arrayNested
          </button>
          <span ref="vmArrayNestedSpliceMultipleArray"></span><br />
        </div>
      </div>

    </div>


    <div class="section-alt">
      <h2>Observable Objects</h2>


      // add prop
    </div>

    <div class="section">
      <h2>Observable Maps</h2>
      <!--  <vue-dd v-model="vm.mapObjectVisual" />-->
      <span v-for="[key, value] in vm.mapObjectVisual">
        {{ key }} => {{ value }};
      </span>

      <br />
      <button @click="vm.mapObjectVisual.set(1, 'test1')">Set Map (1)</button>
      <button @click="vm.mapObjectVisual.set(3, 'test2')">Set Map (3)</button>
      <button @click="vm.mapObjectVisual.delete(1)">Delete from Map (1)</button>
      <button @click="vm.mapObjectVisual.delete(3)">Delete from Map (3)</button>
      <button @click="vm.mapObjectVisual = new Map([['test',true]])">Reassign Map</button>
      <br />
    </div>
    <!--  <vue-dd v-model="vm.setObjectVisual" />-->


    <div class="section-alt">
      <h2>Observable Sets</h2>
      <span v-for="viewSet in vm.setObjectVisual" class="mr-10">
        {{ viewSet }}
      </span>
      <br />
      <button @click="vm.setObjectVisual.add(3)">Add to Set (3)</button>
      <button @click="vm.setObjectVisual.add(5)">Add to Set (5)</button>
      <button @click="vm.setObjectVisual.delete(3)">Delete from Set</button>
      <button @click="vm.setObjectVisual = new Set(['hello'])">Reassign Set</button>
    </div>


    {{ vm.parentGetter }}
    <button @click="vm.parentGetter = 100">Set parent getter directly to 100 (should make error)</button>
    <br />
    <button @click="() => vm._parentGetter = 200">Set parent getter inner value to 200 (should not make error)</button>
    <br />
    <button @click="presenter._parentGetter = 200">Set presenter _parentGetter inner value to 200 (should not make
      error)
    </button>
    <br /><br />

    <br />
    {{ vm.email }}<br />
    <input type="text" v-model="vm.email" /><br />
    vm.hugeArray<br />
    {{ vm.hugeArray[20].struct.user }}<br />
    <input type="text" v-model="vm.hugeArray[20].struct.user" />
    <button @click="vm.alertState()">Alert state</button>
    <br />
    <!-- derived state: {{vm.derivedState[100].struct.user}}<br />-->
    <!--<input type="text" v-model="vm.derivedState[100].struct.user" /><button @click="vm.alertState()">Alert state</button><br />-->
    <!--  hugeArray<br />-->
    <!--  {{hugeObject[100].struct.user}} <br />-->
    <!--<input type="text" v-model="hugeObject[100].struct.user" />-->

    <!--  <Observer>-->watch
    <div v-for="element in vm.viewTest">
      <input type="text" /><input type="text" v-model="element.test1" /> {{ element.sub.test }}
    </div>

    <button @click="() => { vm.viewTest = [{ test1: 'hola', sub:{test:11} }] }">Set value</button>
    <br />


    <button @click="() => { vm.setAuthRepoTest() }">Set value push</button>
    <br />


    <button @click="() => { vm.setAuthRepoArrayKey() }">Set array key & notify</button>
    <br />
    <button @click="() => { vm.setInjectableObservableSubProperties() }">Set injectable authRepo object properties
    </button>
    <br />
    {{ vm.awesome.a.b.c }}


    <!--  {{ vm.viewTest?.[0]?.sub?.test }}-->
    <!--  <vue-dd v-model="vm.awesome" />-->
    <button @click="() => { vm.awesome.a.b.c = 1 }">Set _awesome</button>
    <br />
    <button @click="() => { vm.viewTest[0].sub.test = 'haha' }">Set value sub test</button>
    <br />
    <button @click="() => { vm.setObjectSubProperty() }">Set password object sub property</button>
    <br />
    <button @click="() => { vm.setSpliceArrayProperty() }">Set password splice array prop</button>
    <br />
    <button @click="() => { vm.setArrayPushItem() }">Set password push array value</button>
    <br />
    <button @click="() => { presenter.email = 'eka@eka.ca' }">Set presenter email</button>
    <br />
    <button @click="() => { vm.setViewTestViaMethod() }">Set viewTest via a method</button>
    <br />
    <button @click="() => { vm.setPushSubObjectArrayItem() }">Set password setPushSubObjectArrayItem</button>
    <br />
    <button @click="() => { vm.addObjectSubProperty() }">Set password addObjectSubProperty</button>
    <br />
    <button @click="() => { vm.addObjectProperty() }">Set password addObjectProperty</button>
    <br />
    <button @click="() => { vm.deleteSubObjectProperty() }">Delete password deleteSubObjectProperty</button>
    <br />
    <button @click="() => { vm.setSubProperty() }">Set password setSubProperty</button>
    <br />
    <button @click="() => { vm.setProperty() }">Set password setProperty</button>
    <br />
    <!--{{vm.password}}-->
    <!--  <div v-for="(data, index) in vm.password" :key="index">-->
    <!--    {{ data }}-->
    <!--  </div>-->
    <!--  <div v-if="vm.password[5]">-->
    <!--    {{vm.password[5]}}-->
    <!--  </div>-->
  </div>
</template>
<style>
.rendererParent {
  width: 100%;
  height: 580px;
  border: 1px solid black;
}

h1, h2, h3, h4 {
  font-family: Arial;
  margin: 0 0 0px 0;
  padding: 0;
}

h1 {
  font-size: 20px;
}

h2 {
  font-size: 18px;
}

h3 {
  font-size: 16px;
}

h4 {
  font-size: 14px;
  margin: 0 5px;
}

body {
  font-family: Arial;
  font-size: 12px;
}

.body {
  max-width: 1000px;
  margin: 0 auto;
}

.section {
  padding: 5px 0;
}

.section-alt {
  padding: 15px;
  background: #edf1f6;
  border-radius: 10px;
}

button {
  color: #eee;
  border-radius: 5px;
  border: 0;
  font-size: 11px;
  background: #0075d3;
  margin: 1px 3px;
  padding: 2px 7px;
  display: inline-block;
  cursor: pointer;
}

button:hover {
  background: #08277a;
}

button.pass:hover {
  background: green;
}

button.fail:hover {
  background: red;
}

button:active {
  background: #294dab;
}

.mr-10 {
  margin-right: 10px;
}

.pass {
  background: #00c200;
}

.fail {
  background: #c00606
}
</style>

