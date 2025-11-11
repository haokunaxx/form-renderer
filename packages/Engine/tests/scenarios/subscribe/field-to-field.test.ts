/**
 * 测试场景：字段到字段订阅（顶层字段）
 *
 * 业务场景：用户资料自动填充
 * - 填写手机号后，自动填充为登录账号
 * - 填写邮箱后，自动设置为备用联系方式
 * - 修改姓名后，自动生成显示名称
 *
 * 测试重点：
 * - 精确路径订阅（顶层字段）
 * - ctx.subscriberPath 更新自己
 * - 单向数据流
 * - 避免循环更新
 *
 * Schema 结构：
 * - phone: 手机号
 * - account: 登录账号（订阅 phone）
 * - email: 邮箱
 * - backupContact: 备用联系方式（订阅 email）
 *
 * 数据流：
 * phone 变化 → 触发 account 订阅 → 更新 account
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：字段→字段订阅', () => {
  it('填写手机号自动填充为账号', async () => {
    const schema = {
      type: 'form',
      properties: {
        phone: { type: 'field', required: true },
        account: {
          type: 'field',
          subscribes: {
            phone: (ctx: any) => {
              const phone = ctx.getValue('phone')
              if (phone) {
                ctx.updateValue(ctx.subscriberPath, phone)
              }
            }
          }
        }
      }
    }

    const engine = new FormEngine({ schema })

    engine.updateValue('phone', '13800138000')
    await engine.waitFlush()

    expect(engine.getValue('account')).toBe('13800138000')
  })

  it('填写邮箱自动设置备用联系方式', async () => {
    const schema = {
      type: 'form',
      properties: {
        email: { type: 'field' },
        backupContact: {
          type: 'field',
          subscribes: {
            email: (ctx: any) => {
              const email = ctx.getValue('email')
              ctx.updateValue(ctx.subscriberPath, email ? `邮箱: ${email}` : '')
            }
          }
        }
      }
    }

    const engine = new FormEngine({ schema })

    engine.updateValue('email', 'user@example.com')
    await engine.waitFlush()

    expect(engine.getValue('backupContact')).toBe('邮箱: user@example.com')
  })

  it('清空触发源时清空订阅者', async () => {
    const schema = {
      type: 'form',
      properties: {
        source: { type: 'field' },
        target: {
          type: 'field',
          subscribes: {
            source: (ctx: any) => {
              const value = ctx.getValue('source')
              ctx.updateValue(ctx.subscriberPath, value || '')
            }
          }
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { source: 'test', target: 'test' }
    })

    engine.updateValue('source', '')
    await engine.waitFlush()

    expect(engine.getValue('target')).toBe('')
  })

  it('多个字段订阅同一个触发源', async () => {
    const schema = {
      type: 'form',
      properties: {
        name: { type: 'field' },
        displayName: {
          type: 'field',
          subscribes: {
            name: (ctx: any) => {
              const name = ctx.getValue('name')
              ctx.updateValue(ctx.subscriberPath, name ? `用户: ${name}` : '')
            }
          }
        },
        greeting: {
          type: 'field',
          subscribes: {
            name: (ctx: any) => {
              const name = ctx.getValue('name')
              ctx.updateValue(ctx.subscriberPath, name ? `你好, ${name}` : '')
            }
          }
        }
      }
    }

    const engine = new FormEngine({ schema })

    engine.updateValue('name', 'John')
    await engine.waitFlush()

    expect(engine.getValue('displayName')).toBe('用户: John')
    expect(engine.getValue('greeting')).toBe('你好, John')
  })
})
