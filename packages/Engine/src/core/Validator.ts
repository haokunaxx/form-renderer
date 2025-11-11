import { RenderNode, FieldError, ValidationResult, Context } from '../types'
import { ModelManager } from './ModelManager'
import { UpdateScheduler } from './UpdateScheduler'
import { ParsedSchema } from './SchemaParser'
import { isEmpty } from '../utils'

/**
 * Validator 错误类
 */
export class ValidatorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidatorError'
  }
}

/**
 * 校验器
 * 负责表单校验逻辑
 */
export class Validator {
  private modelManager: ModelManager
  private updateScheduler: UpdateScheduler
  private parsedSchema: ParsedSchema

  /**
   * 构造函数
   * @param modelManager - FormModel 管理器
   * @param updateScheduler - 更新调度器
   * @param parsedSchema - 解析后的 Schema
   */
  constructor(
    modelManager: ModelManager,
    updateScheduler: UpdateScheduler,
    parsedSchema: ParsedSchema
  ) {
    this.modelManager = modelManager
    this.updateScheduler = updateScheduler
    this.parsedSchema = parsedSchema
  }

  /**
   * 校验表单
   * @param renderNode - 渲染树根节点
   * @param paths - 可选的路径或路径数组，不传则校验所有字段
   * @returns 校验结果
   */
  async validate(
    renderNode: RenderNode,
    paths?: string | string[]
  ): Promise<ValidationResult> {
    // 0. 等待 flush 完成，确保基于最新快照
    await this.updateScheduler.waitFlush()

    // 1. 确定校验目标
    let targetPaths: string[]
    if (!paths) {
      // 不传参：校验所有 field
      targetPaths = this.collectFieldPaths(renderNode)
    } else {
      // 传参：校验指定路径
      targetPaths = Array.isArray(paths) ? paths : [paths]
    }

    // 2. 过滤不需要校验的字段
    const nodesToValidate: Array<{ node: RenderNode; path: string }> = []

    for (const path of targetPaths) {
      const node = this.findNodeByPath(renderNode, path)

      // 路径不存在或不是 field，忽略
      if (!node || node.type !== 'field') {
        continue
      }

      // ifShow=false 或 disabled=true 跳过校验
      if (!node.computed?.ifShow || node.computed?.disabled) {
        continue
      }

      nodesToValidate.push({ node, path })
    }

    // 3. 并行校验所有字段
    const errors: FieldError[] = []

    await Promise.all(
      nodesToValidate.map(async ({ node, path }) => {
        const value = this.modelManager.getValue(path)
        const error = await this.validateField(node, value)
        if (error) {
          errors.push(error)
        }
      })
    )

    // 4. 返回结果
    if (errors.length === 0) {
      return true
    }

    // 按路径字典序排序
    errors.sort((a, b) => a.path.localeCompare(b.path))

    // 构建 errorByPath
    const errorByPath: Record<string, FieldError[]> = {}
    for (const error of errors) {
      if (!errorByPath[error.path]) {
        errorByPath[error.path] = []
      }
      errorByPath[error.path].push(error)
    }

    return {
      ok: false,
      errors,
      errorByPath
    }
  }

  /**
   * 校验单个字段
   * @param node - 字段节点
   * @param value - 字段值
   * @returns 错误信息或 null
   */
  private async validateField(
    node: RenderNode,
    value: any
  ): Promise<FieldError | null> {
    // 1. required 校验
    if (node.computed?.required && isEmpty(value)) {
      return {
        path: node.path,
        message: '此字段为必填项',
        code: 'required'
      }
    }

    // 2. 自定义 validators（顺序执行）
    if (node.validators) {
      const ctx = this.buildContext(node.path)

      for (const validator of node.validators) {
        try {
          const result = await validator(value, ctx)
          if (result === true || (typeof result !== 'boolean' && !result)) {
            continue
          }
          if (result) {
            // result 可以是 string 或 FieldError
            if (typeof result === 'string') {
              return {
                path: node.path,
                message: result
              }
            } else {
              // FieldError 对象
              return {
                ...result,
                path: node.path
              }
            }
          }
        } catch (error) {
          // validator 抛错，视为校验失败
          console.error(`Validator error at path "${node.path}":`, error)
          return {
            path: node.path,
            message:
              error instanceof Error ? error.message : 'Validation error',
            code: 'validator_error'
          }
        }
      }
    }

    return null // 校验通过
  }

  /**
   * 构建 Context 上下文
   * @param path - 当前路径
   * @returns Context 对象
   */
  private buildContext(path: string): Context {
    return {
      path,

      getSchema: (p?: string) => {
        const targetPath = p || path
        return this.getSchemaByPath(targetPath)
      },

      getValue: (p?: string) => {
        const targetPath = p || path
        return this.modelManager.getValue(targetPath)
      },

      getCurRowValue: () => {
        const rowPath = this.getNearestRowPath(path)
        if (!rowPath) {
          return undefined
        }
        return this.modelManager.getValue(rowPath)
      },

      getCurRowIndex: () => {
        return this.getNearestRowIndex(path)
      }
    }
  }

  /**
   * 收集所有 field 路径
   * @param node - 根节点
   * @returns 所有 field 的路径数组
   */
  private collectFieldPaths(node: RenderNode): string[] {
    const paths: string[] = []

    const traverse = (n: RenderNode) => {
      if (n.type === 'field') {
        paths.push(n.path)
      }

      if (n.children) {
        if (n.type === 'list') {
          // list children 是二维数组
          for (const row of n.children as RenderNode[][]) {
            for (const child of row) {
              traverse(child)
            }
          }
        } else {
          // form/layout children 是一维数组
          for (const child of n.children as RenderNode[]) {
            traverse(child)
          }
        }
      }
    }

    traverse(node)
    return paths
  }

  /**
   * 在渲染树中查找指定路径的节点
   * @param node - 根节点
   * @param targetPath - 目标路径
   * @returns 找到的节点或 null
   */
  private findNodeByPath(
    node: RenderNode,
    targetPath: string
  ): RenderNode | null {
    if (node.path === targetPath) {
      return node
    }

    if (node.children) {
      if (node.type === 'list') {
        // list children 是二维数组
        for (const row of node.children as RenderNode[][]) {
          for (const child of row) {
            const found = this.findNodeByPath(child, targetPath)
            if (found) return found
          }
        }
      } else {
        // form/layout children 是一维数组
        for (const child of node.children as RenderNode[]) {
          const found = this.findNodeByPath(child, targetPath)
          if (found) return found
        }
      }
    }

    return null
  }

  /**
   * 根据路径获取 SchemaNode
   * @param renderPath - RenderNode 的路径
   * @returns SchemaNode 或 undefined
   */
  private getSchemaByPath(renderPath: string): any {
    const schemaPath = this.convertRenderPathToSchemaPath(renderPath)
    return this.parsedSchema.pathMap.get(schemaPath)
  }

  /**
   * 将 RenderNode 路径转换为 Schema 路径
   * @param renderPath - RenderNode 路径
   * @returns Schema 路径
   */
  private convertRenderPathToSchemaPath(renderPath: string): string {
    if (!renderPath) {
      return ''
    }

    const segments = renderPath.split('.')
    const schemaSegments = segments.map((segment) => {
      if (/^\d+$/.test(segment)) {
        return 'items'
      }
      return segment
    })

    return schemaSegments.join('.')
  }

  /**
   * 获取最近一层 list 的行路径
   * @param path - 当前路径
   * @returns 行路径
   */
  private getNearestRowPath(path: string): string {
    if (!path) {
      return ''
    }

    const segments = path.split('.')

    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        return segments.slice(0, i + 1).join('.')
      }
    }

    return ''
  }

  /**
   * 获取最近一层 list 的行索引
   * @param path - 当前路径
   * @returns 行索引
   */
  private getNearestRowIndex(path: string): number {
    if (!path) {
      return -1
    }

    const segments = path.split('.')

    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        return parseInt(segments[i], 10)
      }
    }

    return -1
  }
}
