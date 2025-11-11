/**
 * 测试场景：条件更新
 *
 * 业务场景：根据条件自动清空或填充字段
 * - 切换到个人用户 → 清空企业信息
 * - 切换到企业用户 → 清空个人信息
 * - 选择"无需发票" → 清空发票信息
 *
 * 测试重点：
 * - 条件判断（if/else）
 * - 清空字段
 * - 单向数据流
 * - 避免循环更新
 *
 * Schema 结构：
 * - userType: 用户类型（'personal' | 'company'）
 * - idCard: 身份证（订阅 userType，personal 时保留，company 时清空）
 * - companyName: 企业名称（订阅 userType，company 时保留，personal 时清空）
 *
 * 数据流：
 * userType 变化 → 触发 idCard 和 companyName 订阅 → 根据条件清空对应字段
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：条件更新', () => {
  it('切换到个人用户清空企业信息', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        companyName: {
          type: 'field',
          subscribes: {
            userType: (ctx: any) => {
              const userType = ctx.getValue('userType')
              if (userType === 'personal') {
                ctx.updateValue(ctx.subscriberPath, '')
              }
            }
          }
        },
        taxId: {
          type: 'field',
          subscribes: {
            userType: (ctx: any) => {
              const userType = ctx.getValue('userType')
              if (userType === 'personal') {
                ctx.updateValue(ctx.subscriberPath, '')
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        userType: 'company',
        companyName: 'ABC Company',
        taxId: '123456'
      }
    })

    // 切换到个人用户
    engine.updateValue('userType', 'personal')
    await engine.waitFlush()

    expect(engine.getValue('companyName')).toBe('')
    expect(engine.getValue('taxId')).toBe('')
  })

  it('切换到企业用户清空个人信息', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        idCard: {
          type: 'field',
          subscribes: {
            userType: (ctx: any) => {
              const userType = ctx.getValue('userType')
              if (userType === 'company') {
                ctx.updateValue(ctx.subscriberPath, '')
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        userType: 'personal',
        idCard: '123456789012345678'
      }
    })

    // 切换到企业用户
    engine.updateValue('userType', 'company')
    await engine.waitFlush()

    expect(engine.getValue('idCard')).toBe('')
  })

  it('选择无需发票清空发票信息', async () => {
    const schema = {
      type: 'form',
      properties: {
        needInvoice: { type: 'field' }, // boolean
        invoiceTitle: {
          type: 'field',
          subscribes: {
            needInvoice: (ctx: any) => {
              const needInvoice = ctx.getValue('needInvoice')
              if (!needInvoice) {
                ctx.updateValue(ctx.subscriberPath, '')
              }
            }
          }
        },
        invoiceTaxId: {
          type: 'field',
          subscribes: {
            needInvoice: (ctx: any) => {
              const needInvoice = ctx.getValue('needInvoice')
              if (!needInvoice) {
                ctx.updateValue(ctx.subscriberPath, '')
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: {
        needInvoice: true,
        invoiceTitle: '发票抬头',
        invoiceTaxId: '税号123'
      }
    })

    // 选择不需要发票
    engine.updateValue('needInvoice', false)
    await engine.waitFlush()

    expect(engine.getValue('invoiceTitle')).toBe('')
    expect(engine.getValue('invoiceTaxId')).toBe('')
  })
})
