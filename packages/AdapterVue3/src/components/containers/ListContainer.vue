<template>
  <component
    v-if="listComponent"
    :is="listComponent"
    v-bind="componentProps"
    :rows="rows"
    :class="containerClass"
    @add="handleAdd"
    @remove="handleRemove"
    @move="handleMove"
  >
    <template #default="{ index }">
      <SchemaRenderer
        v-for="(child, childIndex) in rowChildren?.[index]"
        :key="child.prop || childIndex"
        :node="child"
        :context="createRowContext(index)"
        @field-change="handleFieldChange"
        @field-blur="handleFieldBlur"
        @field-focus="handleFieldFocus"
        @list-add="handleListAdd"
      />
      <!-- TODO:  -->
    </template>
  </component>

  <div v-else :class="containerClass">
    <div
      v-for="(row, index) in rows"
      :key="row.__key || index"
      class="list-row"
    >
      <SchemaRenderer
        v-for="(child, childIndex) in rowChildren?.[index]"
        :key="child.prop || childIndex"
        :node="child"
        :context="createRowContext(index)"
        @field-change="handleFieldChange"
        @field-blur="handleFieldBlur"
        @field-focus="handleFieldFocus"
      />

      <div class="list-row-actions">
        <button type="button" @click="handleRemove(index)">删除</button>
      </div>
    </div>

    <div class="list-actions">
      <button type="button" @click="handleAdd">添加</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RenderNode, ListAddContext } from '@form-renderer/engine'
import type { RenderContext } from '../../types'
import SchemaRenderer from '../SchemaRenderer.vue'
import { getValueByPath } from '../../utils/index'

interface Props {
  node: RenderNode
  context: RenderContext
}

interface Emits {
  (
    e: 'field-change',
    event: { path: string; value: any; component: string }
  ): void
  (e: 'field-blur', event: { path: string; event: FocusEvent }): void
  (e: 'field-focus', event: { path: string; event: FocusEvent }): void
  (e: 'list-add', event: { path: string; value: any }): void
  (e: 'list-remove', event: { path: string; index: number }): void
  (e: 'list-move', event: { path: string; from: number; to: number }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 列表组件
const listComponent = computed(() => {
  if (props.node.component) {
    return props.context.registry.get(props.node.component)?.component
  }
  return null
})

// 组件属性
const componentProps = computed(() => ({
  ...props.node.componentProps,
  title: props.node.label
}))

// 容器类名（根据 show 控制属性添加 hidden 类）
const containerClass = computed(() => {
  const classes: string[] = ['list-container']
  if (props.node.computed?.show === false) {
    classes.push('hidden')
  }
  return classes
})

// 列表行数据
const rows = computed(() => {
  const model = props.context.engine.getModel()?.value
  const value = getValueByPath(model, props.node.path)
  return Array.isArray(value) ? value : []
})

// 行内子节点（列表项的 schema）
const rowChildren = computed<RenderNode[][] | undefined>(() => {
  return props.node.children as RenderNode[][] | undefined
})

// 创建行上下文
const createRowContext = (rowIndex: number): RenderContext => {
  return {
    ...props.context,
    depth: props.context.depth + 1,
    parentType: 'list',
    rowIndex
  }
}

// 处理添加行
/**
 * 递归收集所有字段的默认值（从 SchemaNode 遍历）
 * @param schemaNode - Schema 节点
 * @param result - 累积的结果对象
 * @param context - defaultValue 函数的上下文（ListAddContext）
 */
const collectFieldDefaultsFromSchema = (
  schemaNode: any,
  result: any,
  context: ListAddContext
) => {
  if (!schemaNode) return

  if (schemaNode.type === 'field') {
    // 字段节点，设置默认值（字段级优先级更高，会覆盖 list 级别的值）
    if (schemaNode.defaultValue !== undefined && schemaNode.prop) {
      if (typeof schemaNode.defaultValue === 'function') {
        try {
          result[schemaNode.prop] = schemaNode.defaultValue(context)
        } catch (error) {
          console.error(
            `Error evaluating defaultValue for field ${schemaNode.prop}:`,
            error
          )
        }
      } else {
        result[schemaNode.prop] = schemaNode.defaultValue
      }
    }
  } else if (schemaNode.type === 'layout' && schemaNode.properties) {
    // layout 节点，递归处理 properties（layout 不影响数据路径）
    for (const childSchema of Object.values(schemaNode.properties)) {
      collectFieldDefaultsFromSchema(childSchema, result, context)
    }
  } else if (schemaNode.type === 'list' && schemaNode.prop) {
    // 嵌套的 list，设置为空数组或自定义默认值（如果尚未设置）
    if (result[schemaNode.prop] === undefined) {
      if (schemaNode.defaultValue !== undefined) {
        if (typeof schemaNode.defaultValue === 'function') {
          try {
            result[schemaNode.prop] = schemaNode.defaultValue(context)
          } catch (error) {
            console.error(
              `Error evaluating defaultValue for list ${schemaNode.prop}:`,
              error
            )
          }
        } else {
          result[schemaNode.prop] = schemaNode.defaultValue
        }
      } else {
        // 嵌套 list 的默认值为空数组
        result[schemaNode.prop] = []
      }
    }
  }
}

const handleAdd = () => {
  // 计算默认值
  let defaultRow: any = {}

  // 创建 list-add 上下文供 defaultValue 函数使用
  const context: ListAddContext = {
    mode: 'list-add',
    getValue: (path?: string) => {
      const model = props.context.engine.getModel()?.value
      if (!path) return model
      return props.context.engine.getEngine().getValue(path)
    },
    getListLength: () => rows.value.length,
    getRowData: () => defaultRow
  }

  // 1. 先应用 list 节点自身的 defaultValue（如果有）
  if (props.node.defaultValue !== undefined) {
    if (typeof props.node.defaultValue === 'function') {
      try {
        defaultRow = props.node.defaultValue(context)
      } catch (error) {
        console.error('Error evaluating list-level defaultValue:', error)
        defaultRow = {}
      }
    } else {
      defaultRow = props.node.defaultValue
    }
  }

  // 2. 从 SchemaNode.items 递归收集所有字段级的 defaultValue
  // 通过 Engine 获取当前 list 的 SchemaNode
  const listSchemaNode = props.context.engine
    .getEngine()
    .getSchema(props.node.path)
  if (listSchemaNode && listSchemaNode.items) {
    // items 是一个对象 { [prop: string]: SchemaNode }
    for (const itemSchema of Object.values(listSchemaNode.items)) {
      collectFieldDefaultsFromSchema(itemSchema, defaultRow, context)
    }
  }

  emit('list-add', {
    path: props.node.path,
    value: defaultRow
  })
}

const handleListAdd = (event: { path: string; value: any }) => {
  emit('list-add', event)
}

// 处理删除行
const handleRemove = (index: number) => {
  emit('list-remove', { path: props.node.path, index })
}

// 处理移动行
const handleMove = (from: number, to: number) => {
  emit('list-move', { path: props.node.path, from, to })
}

// 转发字段事件
const handleFieldChange = (event: {
  path: string
  value: any
  component: string
}) => {
  emit('field-change', event)
}

const handleFieldBlur = (event: { path: string; event: FocusEvent }) => {
  emit('field-blur', event)
}

const handleFieldFocus = (event: { path: string; event: FocusEvent }) => {
  emit('field-focus', event)
}
</script>

<style scoped>
.list-container {
  width: 100%;
}

.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.list-row-actions {
  display: flex;
  gap: 4px;
}

.list-actions {
  margin-top: 8px;
}

.hidden {
  display: none;
}
</style>
