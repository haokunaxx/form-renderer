<template>
  <div class="example-container">
    <h2 class="example-title">场景3：商品清单（动态列表）</h2>
    <p class="example-description">
      验证列表操作能力：添加、删除、上移、下移、复制等
    </p>

    <FormAdapter
      ref="formRef"
      :schema="schema"
      v-model:model="formData"
      :components="preset"
      @change="handleChange"
    >
      <template #after-form>
        <div class="form-actions">
          <el-button type="primary" @click="handleSubmit">提交</el-button>
          <el-button @click="handleAddItem">手动添加商品</el-button>
        </div>
      </template>
    </FormAdapter>

    <div class="form-data-display">
      <h3>商品列表数据：</h3>
      <pre>{{ JSON.stringify(formData.productList, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, readonly } from 'vue'
import { ElButton } from 'element-plus'
import { FormAdapter } from '@form-renderer/adapter-vue3'
import { createElementPlusPreset } from '@form-renderer/preset-element-plus'
import type { FormSchema } from '@form-renderer/adapter-vue3'
import type { SubscribeHandlerContext } from '@form-renderer/engine'

const formRef = ref()

const formData = reactive({
  productList: [
    {
      productName: '商品A',
      quantity: 1,
      price: 100,
      total: 100
    }
  ]
})

const preset = createElementPlusPreset()

const schema: FormSchema = {
  type: 'form',
  component: 'form',
  componentProps: {
    labelWidth: '120px'
  },
  properties: {
    productList: {
      type: 'list',
      component: 'list',
      formItemProps: {
        label: '商品清单'
      },
      componentProps: {
        title: '商品列表',
        showHeader: true,
        showAddButton: true,
        addButtonText: '添加商品',
        sortable: true
      },
      items: {
        productName: {
          type: 'field',
          component: 'input',
          formItemProps: {
            label: '商品名称',
            required: true
          },
          componentProps: {
            placeholder: '请输入商品名称'
          },
          required: true
        },
        quantity: {
          type: 'field',
          component: 'number',
          formItemProps: {
            label: '数量',
            required: true
          },
          componentProps: {
            placeholder: '请输入数量',
            min: 1,
            controls: true
          },
          required: true
        },
        price: {
          type: 'field',
          component: 'number',
          formItemProps: {
            label: '单价',
            required: true
          },
          componentProps: {
            placeholder: '请输入单价',
            min: 0,
            precision: 2,
            controls: true
          },
          required: true
        },
        total: {
          type: 'field',
          component: 'number',
          formItemProps: {
            label: '小计'
          },
          // readonly: true,
          disabled: true,
          componentProps: {
            placeholder: '自动计算',
            readonly: true,
            precision: 2
          },
          subscribes: {
            '.quantity': (ctx: SubscribeHandlerContext) => {
              const rowValue = ctx.getCurRowValue()
              const quantity = rowValue?.quantity || 0
              const price = rowValue?.price || 0
              ctx.updateSelf(quantity * price)
            },
            '.price': (ctx: SubscribeHandlerContext) => {
              const rowValue = ctx.getCurRowValue()
              const quantity = rowValue?.quantity || 0
              const price = rowValue?.price || 0
              ctx.updateSelf(quantity * price)
            }
          }
        }
      }
    }
  }
}

const handleChange = (data: any) => {
  console.log('表单数据变更:', data)
  // 自动计算小计
  if (data.productList) {
    data.productList.forEach((item: any) => {
      if (item.quantity && item.price) {
        item.total = item.quantity * item.price
      }
    })
  }
}

const handleSubmit = async () => {
  const result = await formRef.value?.validate()
  console.log('result', result)
  if (result === true) {
    const data = formRef.value?.getValue()
    console.log('提交商品清单:', data)
    alert('商品清单提交成功！')
  }
}

const handleAddItem = () => {
  const listOp = formRef.value?.getListOperator('productList')
  if (listOp) {
    listOp.append({
      productName: '',
      quantity: 1,
      price: 0,
      total: 0
    })
  }
}
</script>
