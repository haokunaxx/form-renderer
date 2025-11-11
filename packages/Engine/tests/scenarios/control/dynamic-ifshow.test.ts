/**
 * 测试场景：动态显示（ifShow）
 *
 * 业务场景：根据条件动态显示/隐藏字段
 * - 个人用户显示身份证，隐藏企业信息
 * - 企业用户显示企业信息，隐藏身份证
 * - 选择"其他"显示备注输入框
 *
 * 测试重点：
 * - ifShow 控制属性函数
 * - computed.ifShow 动态计算
 * - ifShow=false 跳过校验
 * - ifShow=false 不渲染（renderNode 仍存在，由 UI 层决定是否渲染）
 *
 * Schema 结构：
 * - userType: 用户类型
 * - personalInfo: 个人信息 layout（ifShow 依赖 userType）
 * - companyInfo: 企业信息 layout（ifShow 依赖 userType）
 *
 * 控制流：
 * userType 变化 → flush → 重算 computed.ifShow → UI 显示/隐藏
 */

import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../../src/FormEngine'

describe('场景测试：动态显示', () => {
  it('个人用户显示个人信息', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        personalInfo: {
          type: 'layout',
          ifShow: (ctx: any) => ctx.getValue('userType') === 'personal',
          properties: {
            idCard: { type: 'field', required: true }
          }
        },
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
    const personalInfoNode = renderSchema.children![1]
    const companyInfoNode = renderSchema.children![2]

    // 个人用户：显示个人信息，隐藏企业信息
    expect(personalInfoNode.computed!.ifShow).toBe(true)
    expect(companyInfoNode.computed!.ifShow).toBe(false)

    // 切换到企业用户
    engine.updateValue('userType', 'company')
    await engine.waitFlush()

    expect(personalInfoNode.computed!.ifShow).toBe(false)
    expect(companyInfoNode.computed!.ifShow).toBe(true)
  })

  it('ifShow=false 的字段跳过校验', async () => {
    const schema = {
      type: 'form',
      properties: {
        userType: { type: 'field' },
        idCard: {
          type: 'field',
          required: true,
          ifShow: (ctx: any) => ctx.getValue('userType') === 'personal'
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { userType: 'company', idCard: '' }
    })

    // userType='company'，idCard 隐藏
    const renderSchema = engine.getRenderSchema()
    const idCardNode = renderSchema.children![1]
    expect(idCardNode.computed!.ifShow).toBe(false)

    // 校验通过（ifShow=false 跳过校验）
    const result = await engine.validate()
    expect(result).toBe(true)
  })

  it('选择其他显示备注框', async () => {
    const schema = {
      type: 'form',
      properties: {
        category: { type: 'field' },
        remark: {
          type: 'field',
          required: true,
          ifShow: (ctx: any) => ctx.getValue('category') === 'other'
        }
      }
    }

    const engine = new FormEngine({
      schema,
      model: { category: 'electronics', remark: '' }
    })

    const renderSchema = engine.getRenderSchema()
    const remarkNode = renderSchema.children![1]

    // category='electronics'，remark 隐藏
    expect(remarkNode.computed!.ifShow).toBe(false)

    // 选择"其他"
    engine.updateValue('category', 'other')
    await engine.waitFlush()

    expect(remarkNode.computed!.ifShow).toBe(true)

    // 校验失败（remark 为空且必填）
    const result = await engine.validate()
    expect(result).not.toBe(true)
  })
})
