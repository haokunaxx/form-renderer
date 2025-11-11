/**
 * 批量更新工具测试
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  BatchUpdateManager,
  createBatchUpdate,
  mergeUpdates,
  groupUpdatesByPath,
  createUpdateQueue
} from '@/utils/batch'

describe('batch utils', () => {
  let rafSpy: any

  beforeEach(() => {
    rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb: any) => {
        setTimeout(cb, 16)
        return 1
      })
  })

  afterEach(() => {
    rafSpy.mockRestore()
  })

  describe('BatchUpdateManager', () => {
    it('should batch updates', async () => {
      const callback = vi.fn()
      const manager = new BatchUpdateManager(callback)

      manager.scheduleUpdate('path1', 'value1')
      manager.scheduleUpdate('path2', 'value2')

      expect(callback).not.toHaveBeenCalled()

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback).toHaveBeenCalledWith([
        { path: 'path1', value: 'value1' },
        { path: 'path2', value: 'value2' }
      ])
    })

    it('should override updates with same path', async () => {
      const callback = vi.fn()
      const manager = new BatchUpdateManager(callback)

      manager.scheduleUpdate('path', 'value1')
      manager.scheduleUpdate('path', 'value2')
      manager.scheduleUpdate('path', 'value3')

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(callback).toHaveBeenCalledWith([{ path: 'path', value: 'value3' }])
    })

    it('should flush immediately', () => {
      const callback = vi.fn()
      const manager = new BatchUpdateManager(callback)

      manager.scheduleUpdate('path', 'value')
      manager.flush()

      expect(callback).toHaveBeenCalledWith([{ path: 'path', value: 'value' }])
    })

    it('should clear pending updates', () => {
      const callback = vi.fn()
      const manager = new BatchUpdateManager(callback)

      manager.scheduleUpdate('path', 'value')
      manager.clear()
      manager.flush()

      expect(callback).not.toHaveBeenCalled()
    })

    it('should report pending status', () => {
      const manager = new BatchUpdateManager(() => {})

      expect(manager.hasPending()).toBe(false)
      expect(manager.getPendingCount()).toBe(0)

      manager.scheduleUpdate('path', 'value')

      expect(manager.hasPending()).toBe(true)
      expect(manager.getPendingCount()).toBe(1)
    })
  })

  describe('createBatchUpdate', () => {
    it('should batch function calls', async () => {
      const handler = vi.fn()
      const batchedFn = createBatchUpdate(handler)

      batchedFn('arg1')
      batchedFn('arg2')
      batchedFn('arg3')

      expect(handler).not.toHaveBeenCalled()

      await new Promise((resolve) => setTimeout(resolve, 20))

      expect(handler).toHaveBeenCalledTimes(3)
      expect(handler).toHaveBeenNthCalledWith(1, 'arg1')
      expect(handler).toHaveBeenNthCalledWith(2, 'arg2')
      expect(handler).toHaveBeenNthCalledWith(3, 'arg3')
    })
  })

  describe('mergeUpdates', () => {
    it('should merge updates by path', () => {
      const updates = [
        { path: 'a', value: 1 },
        { path: 'b', value: 2 },
        { path: 'a', value: 3 },
        { path: 'c', value: 4 }
      ]

      const merged = mergeUpdates(updates)

      expect(merged).toHaveLength(3)
      expect(merged).toContainEqual({ path: 'a', value: 3 })
      expect(merged).toContainEqual({ path: 'b', value: 2 })
      expect(merged).toContainEqual({ path: 'c', value: 4 })
    })

    it('should handle empty updates', () => {
      expect(mergeUpdates([])).toEqual([])
    })
  })

  describe('groupUpdatesByPath', () => {
    it('should group updates by root path', () => {
      const updates = [
        { path: 'form.field1', value: 1 },
        { path: 'form.field2', value: 2 },
        { path: 'list.0.field', value: 3 },
        { path: 'list.1.field', value: 4 }
      ]

      const groups = groupUpdatesByPath(updates)

      expect(groups.size).toBe(2)
      expect(groups.get('form')).toHaveLength(2)
      expect(groups.get('list')).toHaveLength(2)
    })

    it('should handle single-level paths', () => {
      const updates = [
        { path: 'field1', value: 1 },
        { path: 'field2', value: 2 }
      ]

      const groups = groupUpdatesByPath(updates)

      expect(groups.size).toBe(2)
      expect(groups.get('field1')).toHaveLength(1)
      expect(groups.get('field2')).toHaveLength(1)
    })
  })

  describe('createUpdateQueue', () => {
    it('should queue updates', async () => {
      const onFlush = vi.fn()
      const queue = createUpdateQueue({
        flushDelay: 50,
        onFlush
      })

      queue.add({ path: 'a', value: 1 })
      queue.add({ path: 'b', value: 2 })

      expect(onFlush).not.toHaveBeenCalled()
      expect(queue.size()).toBe(2)

      await new Promise((resolve) => setTimeout(resolve, 60))

      expect(onFlush).toHaveBeenCalledTimes(1)
      expect(queue.size()).toBe(0)
    })

    it('should flush when reaching max size', () => {
      const onFlush = vi.fn()
      const queue = createUpdateQueue({
        maxSize: 2,
        onFlush
      })

      queue.add({ path: 'a', value: 1 })
      expect(onFlush).not.toHaveBeenCalled()

      queue.add({ path: 'b', value: 2 })
      expect(onFlush).toHaveBeenCalledTimes(1)
    })

    it('should merge updates on flush', async () => {
      const onFlush = vi.fn()
      const queue = createUpdateQueue({
        flushDelay: 50,
        onFlush
      })

      queue.add({ path: 'a', value: 1 })
      queue.add({ path: 'a', value: 2 })
      queue.add({ path: 'a', value: 3 })

      await new Promise((resolve) => setTimeout(resolve, 60))

      expect(onFlush).toHaveBeenCalledWith([{ path: 'a', value: 3 }])
    })

    it('should clear queue', () => {
      const onFlush = vi.fn()
      const queue = createUpdateQueue({ onFlush })

      queue.add({ path: 'a', value: 1 })
      queue.clear()
      queue.flush()

      expect(onFlush).not.toHaveBeenCalled()
      expect(queue.size()).toBe(0)
    })
  })
})
