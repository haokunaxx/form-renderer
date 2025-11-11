# Form Renderer 集成测试项目

> 用于验证 FormEngine + AdapterVue + PresetElementPlus + StarterElementPlus 的集成可行性

## 📋 项目简介

这是一个独立的集成测试项目，用于在真实环境中验证 form-renderer 的整体架构和功能。

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

项目将在 `http://localhost:3000` 启动

### 构建项目

```bash
pnpm build
```

## 📁 项目结构

```
integration-test/
├── src/
│   ├── examples/          # 测试场景示例
│   │   ├── 01-basic-form.vue          # 场景1：用户注册表单
│   │   ├── 02-complex-form.vue        # 场景2：订单编辑表单
│   │   ├── 03-dynamic-list.vue        # 场景3：商品清单
│   │   ├── 04-cascade-form.vue        # 场景4：地址级联
│   │   ├── 05-conditional.vue         # 场景5：条件显示
│   │   ├── 06-test-case.vue           # 场景6：测试用例
│   │   ├── 07-starter-basic.vue       # 场景7：StarterElementPlus 基础
│   │   └── 08-starter-complex.vue     # 场景8：StarterElementPlus 复杂
│   ├── schemas/           # Schema 定义（可选）
│   ├── utils/             # 工具函数
│   ├── styles/            # 全局样式
│   ├── App.vue            # 根组件
│   └── main.ts            # 入口文件
├── docs/
│   ├── issues.md                              # 问题记录
│   └── starter-element-plus-integration.md    # StarterElementPlus 测试文档
└── README.md              # 项目说明
```

## 🎯 测试场景

### 基础包测试

#### 场景 1：用户注册表单（基础表单）
- 验证最基本的表单渲染和数据绑定
- 验证表单校验功能
- 验证表单提交和重置功能

#### 场景 2：订单编辑表单（复杂表单）
- 验证复杂字段类型（Input、InputNumber、Select、DatePicker等）
- 验证字段校验规则
- 验证自定义校验器

#### 场景 3：商品清单（动态列表）
- 验证列表操作能力（添加、删除、上移、下移、复制）
- 验证列表数据同步更新
- 验证列表内字段联动（自动计算总价）

#### 场景 4：地址级联（联动表单）
- 验证字段显示/隐藏控制
- 验证字段选项动态更新
- 验证联动数据同步

#### 场景 5：条件显示（动态控制）
- 验证复杂控制逻辑
- 验证字段值清除逻辑
- 验证多条件组合控制

#### 场景 6：测试用例
- 综合测试各种功能

### StarterElementPlus 测试（新增）

#### 场景 7：StarterElementPlus 基础示例

**测试内容：**
- ✅ FormRenderer 组件的基础使用
- ✅ v-model 双向绑定
- ✅ 6 种基础字段类型
- ✅ 表单验证和提交

**代码示例：**
```vue
<template>
  <FormRenderer
    ref="formRef"
    v-model:model="formData"
    :schema="formSchema"
    @change="handleChange"
  />
</template>

<script setup>
import { FormRenderer } from '@form-renderer/starter-element-plus'

const formData = reactive({
  username: '',
  email: '',
  age: undefined
})
</script>
```

**优势展示：**
- 💡 零配置 - 无需手动配置 Engine + Adapter + Preset
- 💡 类型安全 - 完整的 TypeScript 支持
- 💡 开箱即用 - 导入即用，一行代码搞定

#### 场景 8：StarterElementPlus 复杂表单

**测试内容：**
- ✅ 11 种字段类型的完整测试
- ✅ 复杂表单场景
- ✅ 实时数据统计
- ✅ 填充示例数据功能

**字段类型：**
- Input、Textarea、CheckboxGroup
- DatePicker、TimePicker、Cascader
- Rate、ColorPicker、Slider
- Select、Switch

## 📝 文档

- [问题记录](./docs/issues.md)
- [StarterElementPlus 集成测试文档](./docs/starter-element-plus-integration.md)

## 🔧 技术栈

- Vue 3.5
- TypeScript
- Vite
- Element Plus
- Form Renderer (Engine + Adapter + PresetElementPlus + StarterElementPlus)

## 📦 依赖

- `@form-renderer/engine` - 表单引擎核心
- `@form-renderer/adapter-vue3` - Vue3 适配器
- `@form-renderer/preset-element-plus` - ElementPlus 组件预设
- `@form-renderer/starter-element-plus` - 开箱即用启动器包（新增）

## 🎨 使用方式对比

### 方式 1：使用基础包（灵活定制）

```vue
<script setup>
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { ElementPlusPreset } from '@form-renderer/preset-element-plus'

// 需要手动配置组件注册表
</script>

<template>
  <FormAdapter
    :schema="schema"
    :components="ElementPlusPreset"
    v-model:model="formData"
  />
</template>
```

### 方式 2：使用 StarterElementPlus（开箱即用）

```vue
<script setup>
import { FormRenderer } from '@form-renderer/starter-element-plus'

// 无需配置，直接使用
</script>

<template>
  <FormRenderer
    v-model:model="formData"
    :schema="schema"
  />
</template>
```

## 🚀 测试结果

### 基础示例测试
- ✅ 组件导入成功
- ✅ 表单渲染正常
- ✅ 双向绑定工作
- ✅ 表单验证正常
- ✅ 重置和提交功能正常

### 复杂示例测试
- ✅ 11 种字段类型全部正常
- ✅ 级联选择正常工作
- ✅ 日期时间格式化正确
- ✅ 颜色选择支持透明度
- ✅ 实时数据统计正常
- ✅ 批量填充数据成功

详细测试结果请查看：[StarterElementPlus 集成测试文档](./docs/starter-element-plus-integration.md)

## 📄 License

MIT
