<template>
  <div id="app">
    <!-- <el-container>
      <el-header>
        <h1>Form Renderer Vue 2 集成测试</h1>
      </el-header>
      <el-main>
        <el-tabs v-model="activeTab">
          <el-tab-pane label="基础表单" name="basic">
            <basic-form />
          </el-tab-pane>
        </el-tabs>
      </el-main>
    </el-container> -->
    <ComplexDemo />
  </div>
</template>

<script>
// import BasicForm from './examples/01-basic-form.vue'
import ComplexDemo from './components/ComplexDemo.vue'
export default {
  name: 'App',
  components: {
    // BasicForm,
    ComplexDemo
  },
  data() {
    return {
      activeTab: 'basic'
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.el-header {
  text-align: center;
  color: white;
  background-color: #409eff;
  line-height: 60px;
}

.el-main {
  padding: 20px;
}
</style>
