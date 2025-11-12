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
        v-for="(child, childIndex) in rowChildren && rowChildren[index]"
        :key="child.prop || childIndex"
        :node="child"
        :context="createRowContext(index)"
        @field-change="handleFieldChange"
        @field-blur="handleFieldBlur"
        @field-focus="handleFieldFocus"
        @list-add="handleListAdd"
        @list-remove="handleListRemove"
        @list-move="handleListMove"
      />
    </template>
  </component>

  <div v-else :class="containerClass">
    <div
      v-for="(row, index) in rows"
      :key="row.__key || index"
      class="list-row"
    >
      <SchemaRenderer
        v-for="(child, childIndex) in rowChildren && rowChildren[index]"
        :key="child.prop || childIndex"
        :node="child"
        :context="createRowContext(index)"
        @field-change="handleFieldChange"
        @field-blur="handleFieldBlur"
        @field-focus="handleFieldFocus"
        @list-add="handleListAdd"
        @list-remove="handleListRemove"
        @list-move="handleListMove"
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

<script>
function getValueByPath(obj, path) {
  if (!path) return obj
  return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

export default {
  name: 'ListContainer',

  components: {
    SchemaRenderer: () => import('../SchemaRenderer.vue')
  },

  props: {
    node: {
      type: Object,
      required: true
    },
    context: {
      type: Object,
      required: true
    }
  },

  computed: {
    // 列表组件
    listComponent() {
      if (this.node.component) {
        const componentDef = this.context.registry.get(this.node.component)
        return componentDef?.component
      }
      return null
    },

    // 组件属性
    componentProps() {
      return {
        ...this.node.componentProps,
        title: this.node.label
      }
    },

    // 容器类名（根据 show 控制属性添加 hidden 类）
    containerClass() {
      const classes = ['list-container']
      if (this.computed.show === false) {
        classes.push('hidden')
      }
      return classes
    },

    computed() {
      return this.node.computed || {}
    },

    // 列表行数据（使用 getValueByPath 支持嵌套路径）
    rows() {
      // const model = this.context.engine.getModel()?.value
      const model = this.context.model
      const value = getValueByPath(model, this.node.path)
      return Array.isArray(value) ? value : []
    },

    // 行内子节点（列表项的 schema）- 二维数组
    rowChildren() {
      return this.node.children
    }
  },

  methods: {
    // 创建行上下文
    createRowContext(rowIndex) {
      return {
        ...this.context,
        depth: this.context.depth + 1,
        parentType: 'list',
        rowIndex
      }
    },

    // 处理添加行
    handleAdd() {
      let defaultRow = {}

      // 创建 list-add 上下文供 defaultValue 函数使用
      const context = {
        mode: 'list-add',
        getValue: (path) => {
          const model = this.context.engine.getModel()?.value
          if (!path) return model
          return this.context.engine.getEngine().getValue(path)
        },
        getListLength: () => this.rows.length,
        getRowData: () => defaultRow
      }

      // 1. 先应用 list 节点自身的 defaultValue（如果有）
      if (this.node.defaultValue !== undefined) {
        if (typeof this.node.defaultValue === 'function') {
          try {
            defaultRow = this.node.defaultValue(context)
          } catch (error) {
            console.error('Error evaluating list-level defaultValue:', error)
            defaultRow = {}
          }
        } else {
          defaultRow = this.node.defaultValue
        }
      }

      // 2. 从 SchemaNode.items 递归收集所有字段级的 defaultValue
      const listSchemaNode = this.context.engine
        .getEngine()
        .getSchema(this.node.path)

      if (listSchemaNode && listSchemaNode.items) {
        for (const itemSchema of Object.values(listSchemaNode.items)) {
          this.collectFieldDefaultsFromSchema(itemSchema, defaultRow, context)
        }
      }
      console.log('---> ListContainer handleAdd', this.node, defaultRow)
      this.$emit('list-add', {
        path: this.node.path,
        value: defaultRow
      })
    },

    // 递归收集字段默认值
    collectFieldDefaultsFromSchema(schemaNode, result, context) {
      if (!schemaNode) return

      if (schemaNode.type === 'field') {
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
        for (const childSchema of Object.values(schemaNode.properties)) {
          this.collectFieldDefaultsFromSchema(childSchema, result, context)
        }
      } else if (schemaNode.type === 'list' && schemaNode.prop) {
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
            result[schemaNode.prop] = []
          }
        }
      }
    },

    handleListAdd(event) {
      this.$emit('list-add', event)
    },

    // 处理删除行
    handleRemove(index) {
      this.$emit('list-remove', { path: this.node.path, index })
    },

    // 处理移动行
    handleMove(from, to) {
      this.$emit('list-move', { path: this.node.path, from, to })
    },

    // 转发字段事件
    handleFieldChange(event) {
      this.$emit('field-change', event)
    },

    handleFieldBlur(event) {
      this.$emit('field-blur', event)
    },

    handleFieldFocus(event) {
      this.$emit('field-focus', event)
    },

    handleListRemove(event) {
      this.$emit('list-remove', event)
    },

    handleListMove(event) {
      this.$emit('list-move', event)
    }
  }
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
