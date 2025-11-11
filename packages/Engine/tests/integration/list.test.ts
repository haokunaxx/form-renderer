import { describe, it, expect } from 'vitest'
import { FormEngine } from '../../src/FormEngine'

describe('集成测试：列表操作', () => {
  it('完整的列表操作流程', async () => {
    const schema = {
      type: 'form',
      properties: {
        list: {
          type: 'list',
          items: {
            name: { type: 'field', required: true }
          }
        }
      }
    }

    const engine = new FormEngine({ schema, model: { list: [] } })

    // 1. append
    engine.listAppend('list', { name: 'Item 1' })
    engine.listAppend('list', { name: 'Item 2' })
    await engine.waitFlush()

    expect(engine.getValue('list')).toHaveLength(2)

    // 2. insert
    engine.listInsert('list', 1, { name: 'Item 1.5' })
    await engine.waitFlush()

    expect(engine.getValue('list')).toHaveLength(3)
    expect(engine.getValue('list.0.name')).toBe('Item 1')
    expect(engine.getValue('list.1.name')).toBe('Item 1.5')
    expect(engine.getValue('list.2.name')).toBe('Item 2')

    // 3. move
    engine.listMove('list', 0, 2)
    await engine.waitFlush()

    expect(engine.getValue('list.0.name')).toBe('Item 1.5')
    expect(engine.getValue('list.1.name')).toBe('Item 2')
    expect(engine.getValue('list.2.name')).toBe('Item 1')

    // 4. swap
    engine.listSwap('list', 0, 2)
    await engine.waitFlush()

    expect(engine.getValue('list.0.name')).toBe('Item 1')
    expect(engine.getValue('list.2.name')).toBe('Item 1.5')

    // 5. replace
    engine.listReplace('list', 1, { name: 'Updated' })
    await engine.waitFlush()

    expect(engine.getValue('list.1.name')).toBe('Updated')

    // 6. remove
    engine.listRemove('list', 1)
    await engine.waitFlush()

    expect(engine.getValue('list')).toHaveLength(2)

    // 7. clear
    engine.listClear('list')
    await engine.waitFlush()

    expect(engine.getValue('list')).toHaveLength(0)
  })

  it('list 操作后 renderNode 正确更新', async () => {
    const schema = {
      type: 'form',
      properties: {
        list: {
          type: 'list',
          items: {
            field: { type: 'field' }
          }
        }
      }
    }

    const engine = new FormEngine({ schema, model: { list: [] } })
    const renderSchema = engine.getRenderSchema()
    const listNode = renderSchema.children![0]

    expect(listNode.children).toHaveLength(0)

    // append 3 行
    engine.listAppend('list', {})
    engine.listAppend('list', {})
    engine.listAppend('list', {})
    await engine.waitFlush()

    expect(listNode.children).toHaveLength(3)
    expect(listNode.children![0][0].path).toBe('list.0.field')
    expect(listNode.children![1][0].path).toBe('list.1.field')
    expect(listNode.children![2][0].path).toBe('list.2.field')

    // remove 中间行
    engine.listRemove('list', 1)
    await engine.waitFlush()

    expect(listNode.children).toHaveLength(2)
    expect(listNode.children![0][0].path).toBe('list.0.field')
    expect(listNode.children![1][0].path).toBe('list.1.field')
  })

  it('通配符更新 list 内字段', async () => {
    const schema = {
      type: 'form',
      properties: {
        list: {
          type: 'list',
          items: {
            status: { type: 'field' },
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

    // 通配符批量更新
    engine.updateValue('list.*.status', 'active')
    await engine.waitFlush()

    expect(engine.getValue('list.0.status')).toBe('active')
    expect(engine.getValue('list.1.status')).toBe('active')
    expect(engine.getValue('list.2.status')).toBe('active')
  })
})
