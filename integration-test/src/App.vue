<template>
  <div class="page-container">
    <div class="page-header">
      <h1>🚀 Form Renderer 集成测试</h1>
      <p>
        验证 FormEngine + AdapterVue + PresetElementPlus + StarterElementPlus
        的集成可行性
      </p>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="demo-tabs">
      <el-tab-pane label="基础包测试" name="basic">
        <ComplexDemoExample />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// import BasicFormExample from './examples/01-basic-form.vue'
// import ComplexFormExample from './examples/02-complex-form.vue'
// import DynamicListExample from './examples/03-dynamic-list.vue'
// import CascadeFormExample from './examples/04-cascade-form.vue'
// import ConditionalFormExample from './examples/05-conditional.vue'
// import TestCaseExample from './examples/06-test-case.vue'
// import StarterBasicExample from './examples/07-starter-basic.vue'
// import StarterComplexExample from './examples/08-starter-complex.vue'
import ComplexDemoExample from './examples/complex-demo.vue'

const activeTab = ref('basic')
</script>
