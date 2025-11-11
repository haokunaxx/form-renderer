# 项目说明
该项目是一个表单渲染器项目，通过pnpm + workspace搭建的monorepo项目，核心包都在/packages目录下。

通过FormEngine提供的表单引擎能力，开发Vue3/React的表单适配器，适配不同框架的不同UI组件库。目标是开发一次适配器，可以尽可能的小成本切换不同的UI框架，比如Vue3框架开发的表单适配器在PC和H5可以asap切换不同的UI组件库如ElementPlus和Vant4。

架构上理想情况下分成三层，分别是：Vue/React UI组件库 <-> Vue/React适配器 <-> FormEngine


# 目录结构

packages
  - FormEngine 表单引擎
  - AdapterVue Vue3版本的表单适配器
  - AdapterPresetElementPlus ElementPlus UI组件库的组件预设
  - AdapterPresetVant Vant UI组件库的组件预设
  - AdapterReact React版本的表单适配器（开发完成Vue的版本之后的下一个版本开发）


# 文档
- [FormEngine 开发设计文档](./FORM_ENGINE_DESIGN.md)
- [Vue3 表单适配器开发设计文档](./FORM_ADAPTER_VUE_DESIGN.md)


# 开发规范
- 创建项目优先通过pnpm + vite进行创建



