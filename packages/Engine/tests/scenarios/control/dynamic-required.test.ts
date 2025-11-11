/**
 * 测试场景：动态必填
 *
 * 业务场景：根据用户类型决定哪些字段必填
 * - 个人用户：身份证必填，企业信息不必填
 * - 企业用户：企业信息必填，身份证不必填
 * - 需要发票：发票信息必填
 *
 * 测试重点：
 * - required 控制属性函数
 * - computed.required 动态计算
 * - 校验联动（required 变化影响校验结果）
 * - ctx.getValue 访问其他字段
 *
 * Schema 结构：
 * - userType: 用户类型
 * - idCard: 身份证（required 依赖 userType）
 * - companyName: 企业名称（required 依赖 userType）
 *
 * 控制流：
 * userType 变化 → flush → 重算 computed.required → 校验结果变化
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：动态必填', () => {
  it('个人用户身份证必填', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        idCard: {
          type: 'field',
          required: (ctx: any) => ctx.getValue('userType') === 'personal'
        },
        companyName: {
          type: 'field',
          required: (ctx: any) => ctx.getValue('userType') === 'company'
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        userType: 'personal',
        idCard: '',
        companyName: ''
      }
    })

    const renderSchema = engine.getRenderSchema()
    const idCardNode = renderSchema.children![1]
    const companyNameNode = renderSchema.children![2]

    // 个人用户：idCard 必填，companyName 不必填
    expect(idCardNode.computed!.required).toBe(true)
    expect(companyNameNode.computed!.required).toBe(false)

    // 校验失败（idCard 为空）
    let result = await engine.validate()
    expect(result).not.toBe(true)

    // 切换到企业用户
    engine.updateValue('userType', 'company')
    await engine.waitFlush()

    expect(idCardNode.computed!.required).toBe(false)
    expect(companyNameNode.computed!.required).toBe(true)

    // 校验失败（companyName 为空）
    result = await engine.validate()
    expect(result).not.toBe(true)
  })

  it('需要发票时发票信息必填', async () => {
    const schema = {
      type: 'form',
      properties: {
        needInvoice: { type: 'field' },
        invoiceTitle: {
          type: 'field',
          required: (ctx: any) => ctx.getValue('needInvoice') === true
        },
        invoiceTaxId: {
          type: 'field',
          required: (ctx: any) => ctx.getValue('needInvoice') === true
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        needInvoice: false,
        invoiceTitle: '',
        invoiceTaxId: ''
      }
    })

    // 不需要发票：校验通过
    let result = await engine.validate()
    expect(result).toBe(true)

    // 选择需要发票
    engine.updateValue('needInvoice', true)
    await engine.waitFlush()

    // 校验失败（发票信息为空）
    result = await engine.validate()
    expect(result).not.toBe(true)
    if (result !== true) {
      expect(result.errors.length).toBe(2)
    }
  })

  it('list 中的动态必填', async () => {
    const schema = {
      type: 'form',
      properties: {
        items: {
          type: 'list',
          items: {
            type: { type: 'field' }, // 'product' | 'service'
            productCode: {
              type: 'field',
              required: (ctx: any) => {
                const row = ctx.getCurRowValue()
                return row.type === 'product'
              }
            },
            serviceHours: {
              type: 'field',
              required: (ctx: any) => {
                const row = ctx.getCurRowValue()
                return row.type === 'service'
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        items: [{ type: 'product', productCode: '', serviceHours: '' }]
      }
    })

    const renderSchema = engine.getRenderSchema()
    const listNode = renderSchema.children![0]
    const productCodeNode = listNode.children![0][1]
    const serviceHoursNode = listNode.children![0][2]

    // type='product'：productCode 必填，serviceHours 不必填
    expect(productCodeNode.computed!.required).toBe(true)
    expect(serviceHoursNode.computed!.required).toBe(false)

    // 切换类型
    engine.updateValue('items.0.type', 'service')
    await engine.waitFlush()

    expect(productCodeNode.computed!.required).toBe(false)
    expect(serviceHoursNode.computed!.required).toBe(true)
  })
})
