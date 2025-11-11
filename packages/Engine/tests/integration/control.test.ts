import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：控制属性动态计算', () => {
  it('ifShow 动态变化', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        companyInfo: {
          type: 'layout',
          ifShow: (ctx: any) => ctx.getValue('userType') === 'company',
          properties: {
            companyName: { type: 'field', required: true }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { userType: 'personal' }
    })

    const renderSchema = engine.getRenderSchema()
    const companyInfoNode = renderSchema.children![1]

    // 初始：ifShow=false
    expect(companyInfoNode.computed!.ifShow).toBe(false)

    // 修改 userType
    engine.updateValue('userType', 'company')
    await engine.waitFlush()

    // ifShow 变为 true
    expect(companyInfoNode.computed!.ifShow).toBe(true)
  })

  it('required 动态变化并影响校验', async () => {
    const schema = {
      type: 'form',
      properties: {
        type: { type: 'field' },
        address: {
          type: 'field',
          required: (ctx: any) => ctx.getValue('type') === 'company'
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { type: 'personal', address: '' }
    })

    // type='personal'，address 不必填，校验通过
    let result = await engine.validate()
    expect(result).toBe(true)

    // 修改 type
    engine.updateValue('type', 'company')
    await engine.waitFlush()

    // type='company'，address 必填，校验失败
    result = await engine.validate()
    expect(result).not.toBe(true)
    if (result !== true) {
      expect(result.errors[0].path).toBe('address')
    }

    // 填写 address
    engine.updateValue('address', 'Company Address')
    await engine.waitFlush()

    // 校验通过
    result = await engine.validate()
    expect(result).toBe(true)
  })

  it('disabled 继承', async () => {
    const schema = {
      type: 'form',
      properties: {
        enableCard: { type: 'field' },
        card: {
          type: 'layout',
          disabled: (ctx: any) => !ctx.getValue('enableCard'),
          properties: {
            field1: { type: 'field', required: true },
            field2: { type: 'field', required: true }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { enableCard: false, field1: '', field2: '' }
    })

    const renderSchema = engine.getRenderSchema()
    const cardNode = renderSchema.children![1]
    const field1Node = cardNode.children![0]

    // enableCard=false，card 和子字段都 disabled
    expect(cardNode.computed!.disabled).toBe(true)
    expect(field1Node.computed!.disabled).toBe(true)

    // disabled 的字段跳过校验
    const result = await engine.validate()
    expect(result).toBe(true)

    // 启用
    engine.updateValue('enableCard', true)
    await engine.waitFlush()

    expect(cardNode.computed!.disabled).toBe(false)
    expect(field1Node.computed!.disabled).toBe(false)

    // 现在会校验，失败
    const result2 = await engine.validate()
    expect(result2).not.toBe(true)
  })

  it('list 中的控制属性', async () => {
    const schema = {
      type: 'form',
      properties: {
        list: {
          type: 'list',
          items: {
            isFirst: {
              type: 'field',
              // 只有第0行的 isFirst 为 true
              ifShow: (ctx: any) => ctx.getCurRowIndex() === 0
            },
            name: { type: 'field' }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        list: [{ name: 'a' }, { name: 'b' }, { name: 'c' }]
      }
    })

    const renderSchema = engine.getRenderSchema()
    const listNode = renderSchema.children![0]

    // 第0行的 isFirst: ifShow=true
    expect(listNode.children![0][0].computed!.ifShow).toBe(true)
    // 第1行的 isFirst: ifShow=false
    expect(listNode.children![1][0].computed!.ifShow).toBe(false)
    // 第2行的 isFirst: ifShow=false
    expect(listNode.children![2][0].computed!.ifShow).toBe(false)

    // insert(0, item) 后，索引变化
    engine.listInsert('list', 0, { name: 'new' })
    await engine.waitFlush()

    // 新的第0行：ifShow=true
    expect(listNode.children![0][0].computed!.ifShow).toBe(true)
    // 原第0行（现在是第1行）：ifShow=false
    expect(listNode.children![1][0].computed!.ifShow).toBe(false)
  })
})
