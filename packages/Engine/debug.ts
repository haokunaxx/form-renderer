/**
 * 调试脚本
 *
 * 推荐使用方法:
 *   npx tsx debug.ts
 *
 * 如需编译:
 *   npx tsc debug.ts --downlevelIteration
 */

import { FormEngine, JsonSchemaNode } from './src/index'

// 示例1: 基础表单调试
async function debugBasicForm() {
  console.log('=== 调试基础表单 ===')

  const schema: JsonSchemaNode = {
    type: 'form' as const,
    properties: {
      name: {
        type: 'field' as const,
        required: true,
        subscribes: [
          {
            target: 'age',
            handler: ({ updateValue, getValue }) => {
              updateValue('name', (getValue('name') || 'name') + '!')
            }
          }
        ]
      },
      email: {
        type: 'field' as const,
        required: true,
        subscribes: [
          {
            target: 'name',
            handler: ({ updateValue, getValue }) => {
              updateValue('email', (getValue('email') || 'email') + '!')
            }
          }
        ]
      },
      age: {
        type: 'field' as const,
        required: true,
        subscribes: [
          {
            target: 'email',
            handler: ({ updateValue, getValue }) => {
              updateValue('age', (getValue('age') || 'age') + '!')
            }
          }
        ]
      }
    }
  }

  const model = {
    name: '',
    email: ''
  }

  const engine = new FormEngine({ schema, model })
  engine.onValueChange((params) => {
    console.log('value changed', engine.getValue(), params)
  })
  // 打印初始状态
  // console.log("初始值:", engine.getValue());
  // console.log("初始 Schema:", engine.getSchema());

  // 更新值
  try {
    engine.updateValue('name', 'Test User')
    await engine.waitFlush()
  } catch (error) {
    console.log('error', error)
  }
  console.log('更新 name 后:', engine.getValue())
  // engine.updateValue("email", "hello1");
  // engine.updateValue("email", "hello2");
  // engine.updateValue("email", "hello3");
  // await engine.waitFlush();
  // console.log("更新 email 后:", engine.getValue());

  // 校验
  engine.validate().then((result) => {
    console.log('校验结果:', result)
  })
}

// 示例2: 列表表单调试
async function debugListForm() {
  console.log('\n=== 调试列表表单 ===')

  const schema = {
    type: 'form' as const,
    properties: {
      controlName: {
        type: 'field' as const,
        required: true
      },
      list: {
        type: 'list' as const,
        items: {
          name: {
            type: 'field' as const,
            required: true
          },
          price: {
            type: 'field' as const
          },
          name1: {
            type: 'field' as const,
            required: true,
            subscribes: [
              {
                target: '.name',
                handler: ({
                  updateValue,
                  getCurRowValue,
                  subscriberPath,
                  getCurRowIndex
                }) => {
                  const rowValue = getCurRowValue()
                  rowValue.name &&
                    updateValue(
                      subscriberPath,
                      rowValue.name + '!!!!!' + getCurRowIndex()
                    )
                }
              }
            ]
          },
          name2: {
            type: 'field' as const,
            required: true,
            subscribes: [
              {
                target: 'controlName',
                handler: (ctx) => {
                  const { updateValue, getValue, subscriberPath } = ctx
                  const name = getValue('controlName')
                  name && updateValue(subscriberPath, name + '??????')
                }
              }
            ]
          }
        }
      }
    }
  }

  const model = {
    controlName: '',
    list: [{ name: 'Item 1', price: 100 }]
  }

  const engine = new FormEngine({ schema, model })

  // console.log("初始列表:", engine.getValue("items"));

  // 添加一行
  engine.listAppend('list', { name: 'Item 2', price: 200 })
  console.log('添加后:', engine.getValue())

  engine.updateValue('controlName', 'Control Name')
  await engine.waitFlush()
  console.log('更新 controlName 后:', engine.getValue())

  console.log('=== 开始同步代码 ===')

  engine.updateValue('list.0.name', 'NAME')
  console.log('第一次 updateValue 完成')

  engine.updateValue('list.1.name', 'NAME2')
  console.log('第二次 updateValue 完成')

  console.log('=== 同步代码结束 ===')

  await engine.waitFlush()
  console.log('=== flush 完成 ===')
  console.log('更新 list.0.name 后:', engine.getValue())
  // engine.updateValue("list.1.name", "NAME2");
  // await engine.waitFlush();
  // console.log("更新 list.1.name 后:", engine.getValue());
}

// 运行调试
await debugBasicForm()
// await debugListForm();
