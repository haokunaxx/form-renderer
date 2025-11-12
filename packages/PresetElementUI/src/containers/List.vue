<template>
  <div class="element-ui-list" :class="{ bordered }">
    <div v-if="title || showActions" class="element-ui-list__header">
      <h4 v-if="title" class="element-ui-list__title">{{ title }}</h4>
      <button
        v-if="showActions && canAdd"
        type="button"
        class="element-ui-list__btn element-ui-list__add-btn"
        @click="handleAdd"
      >
        + 添加
      </button>
    </div>

    <div class="element-ui-list__body">
      <div v-if="rows.length > 0" class="element-ui-list__item-count">
        共 {{ rows.length }} 项
      </div>
      <div
        v-for="(row, index) in rows"
        :key="row.__key || index"
        class="element-ui-list__item"
      >
        <div class="element-ui-list__item-index">{{ index + 1 }}</div>

        <div class="element-ui-list__item-content">
          <slot :row="row" :index="index" />
        </div>

        <div v-if="showActions" class="element-ui-list__item-actions">
          <button
            v-if="canMoveUp(index)"
            type="button"
            class="element-ui-list__btn element-ui-list__btn-icon"
            title="上移"
            @click="handleMove(index, index - 1)"
          >
            ↑
          </button>
          <button
            v-if="canMoveDown(index)"
            type="button"
            class="element-ui-list__btn element-ui-list__btn-icon"
            title="下移"
            @click="handleMove(index, index + 1)"
          >
            ↓
          </button>
          <button
            v-if="canRemove"
            type="button"
            class="element-ui-list__btn element-ui-list__btn-danger"
            @click="handleRemove(index)"
          >
            删除
          </button>
        </div>
      </div>

      <div v-if="rows.length === 0" class="element-ui-list__empty">
        <span class="element-ui-list__empty-text">{{ emptyText }}</span>
        <button
          v-if="showActions && canAdd"
          type="button"
          class="element-ui-list__btn element-ui-list__add-btn"
          @click="handleAdd"
        >
          + 添加第一项
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/**
 * 列表容器组件
 */
export default {
  name: 'ContainerList',

  props: {
    rows: {
      type: Array,
      default: () => []
    },
    title: {
      type: String,
      default: undefined
    },
    bordered: {
      type: Boolean,
      default: true
    },
    showActions: {
      type: Boolean,
      default: true
    },
    maxRows: {
      type: Number,
      default: undefined
    },
    minRows: {
      type: Number,
      default: 0
    },
    emptyText: {
      type: String,
      default: '暂无数据'
    }
  },

  computed: {
    // 是否可以添加
    canAdd() {
      if (this.maxRows === undefined) return true
      return this.rows.length < this.maxRows
    },

    // 是否可以删除
    canRemove() {
      return this.rows.length > (this.minRows ?? 0)
    }
  },

  methods: {
    // 是否可以上移
    canMoveUp(index) {
      return index > 0
    },

    // 是否可以下移
    canMoveDown(index) {
      return index < this.rows.length - 1
    },

    handleAdd() {
      this.$emit('add')
    },

    handleRemove(index) {
      this.$emit('remove', index)
    },

    handleMove(from, to) {
      this.$emit('move', from, to)
    }
  }
}
</script>

<style scoped>
.element-ui-list {
  padding: 12px;
  background: #fff;
}

.element-ui-list.bordered {
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.element-ui-list__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 12px;
  margin-bottom: 12px;
  border-bottom: 1px solid #ebeef5;
}

.element-ui-list__title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.element-ui-list__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.element-ui-list__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.element-ui-list__item:hover {
  background: #ebeef5;
}

.element-ui-list__item-index {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  color: #fff;
  background: #409eff;
  border-radius: 50%;
  flex-shrink: 0;
  font-weight: 500;
}

.element-ui-list__item-content {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.element-ui-list__item-actions {
  flex-shrink: 0;
  display: flex;
  gap: 4px;
}

.element-ui-list__empty {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px 20px;
  text-align: center;
  flex-direction: column;
}

.element-ui-list__empty-text {
  margin-bottom: 12px;
  color: #909399;
}

.element-ui-list__btn {
  padding: 6px 12px;
  font-size: 14px;
  color: #606266;
  background: #fff;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  transition: all 0.2s;
  cursor: pointer;
}

.element-ui-list__btn:hover {
  color: #409eff;
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

.element-ui-list__btn:active {
  color: #3a8ee6;
  border-color: #3a8ee6;
}

.element-ui-list__btn-icon {
  padding: 4px 8px;
  font-size: 16px;
  font-weight: bold;
}

.element-ui-list__btn-danger {
  color: #f56c6c;
  border-color: #f56c6c;
}

.element-ui-list__btn-danger:hover {
  background-color: #fef0f0;
  border-color: #fab6b6;
}

.element-ui-list__add-btn {
  color: #409eff;
  border-color: #409eff;
}

.element-ui-list__add-btn:hover {
  background-color: #ecf5ff;
  border-color: #c6e2ff;
}

.element-ui-list__item-count {
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
}
</style>
