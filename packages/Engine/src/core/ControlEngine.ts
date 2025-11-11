import { RenderNode, ControlAttr, Context, SchemaNode } from '../types'
import { ModelManager } from './ModelManager'
import { ParsedSchema } from './SchemaParser'
import { isPlainObject, deepEqual } from '../utils'

/**
 * 已计算的控制属性
 */
export interface ComputedControl {
  required: boolean
  disabled: boolean
  readonly: boolean
  ifShow: boolean
  show: boolean
  componentProps?: any
  formItemProps?: any
}

/**
 * ControlEngine 错误类
 */
export class ControlEngineError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ControlEngineError'
  }
}

/**
 * 控制属性计算引擎
 * 负责计算 RenderNode 的控制属性，并写入 computed 字段
 */
export class ControlEngine {
  private modelManager: ModelManager
  private parsedSchema: ParsedSchema

  /**
   * 构造函数
   * @param modelManager - FormModel 管理器
   * @param parsedSchema - 解析后的 Schema
   */
  constructor(modelManager: ModelManager, parsedSchema: ParsedSchema) {
    this.modelManager = modelManager
    this.parsedSchema = parsedSchema
  }

  /**
   * 全量计算所有节点的控制属性
   * @param renderNode - 渲染树的根节点
   * @returns 新的渲染树根节点（不可变更新）
   *
   * 注意：为了向后兼容（测试代码），同时会原地修改传入的 renderNode
   */
  computeAll(renderNode: RenderNode): RenderNode {
    const newNode = this.computeNode(renderNode)

    // 🔥 向后兼容：同时原地更新传入的节点
    // 这样即使测试代码没有保存返回值，也能正常工作
    if (newNode !== renderNode) {
      renderNode.computed = newNode.computed
      renderNode.children = newNode.children as any
    }

    return newNode
  }

  /**
   * 计算单个节点及其子节点的控制属性（不可变更新）
   * @param node - 当前节点
   * @param parentComputed - 父节点的 computed（用于继承）
   * @returns 新的节点（如果 computed 改变则创建新节点，否则复用原节点）
   */
  private computeNode(
    node: RenderNode,
    parentComputed?: ComputedControl
  ): RenderNode {
    // 构建 Context
    const ctx = this.buildContext(node.path)

    // 计算本节点的原始值
    const required = this.executeControlAttr(node.required, ctx, false)
    const disabled = this.executeControlAttr(node.disabled, ctx, false)
    const readonly = this.executeControlAttr(node.readonly, ctx, false)
    const ifShow = this.executeControlAttr(node.ifShow, ctx, true)
    const show = this.executeControlAttr(node.show, ctx, true)

    // 计算动态属性（componentProps、formItemProps）
    const componentProps =
      typeof node.componentProps === 'function'
        ? node.componentProps(ctx)
        : undefined
    const formItemProps =
      typeof node.formItemProps === 'function'
        ? node.formItemProps(ctx)
        : undefined

    // 应用继承规则
    const computed: ComputedControl = {
      // required: 不继承
      required,
      // disabled: 任一祖先为 true 则继承为 true
      disabled: disabled || (parentComputed?.disabled ?? false),
      // readonly: 任一祖先为 true 则继承为 true
      readonly: readonly || (parentComputed?.readonly ?? false),
      // ifShow: 任一祖先为 false 则继承为 false
      ifShow: ifShow && (parentComputed?.ifShow ?? true),
      // show: 不继承
      show,
      // 动态属性
      componentProps,
      formItemProps
    }

    // 检查 computed 是否改变
    const computedChanged =
      !node.computed ||
      node.computed.required !== computed.required ||
      node.computed.disabled !== computed.disabled ||
      node.computed.readonly !== computed.readonly ||
      node.computed.ifShow !== computed.ifShow ||
      node.computed.show !== computed.show ||
      !deepEqual(node.computed.componentProps, computed.componentProps) ||
      !deepEqual(node.computed.formItemProps, computed.formItemProps)

    // console.log('++++', node, node.prop, computed, node, computedChanged)

    // 递归计算子节点
    let newChildren: RenderNode[] | RenderNode[][] | undefined
    let childrenChanged = false

    if (node.children) {
      if (node.type === 'list') {
        // list children 是二维数组
        const rows = node.children as RenderNode[][]
        const newRows: RenderNode[][] = []
        for (const row of rows) {
          const newRow: RenderNode[] = []
          for (const child of row) {
            const newChild = this.computeNode(child, computed)
            newRow.push(newChild)
            if (newChild !== child) {
              childrenChanged = true
            }
          }
          newRows.push(newRow)
        }
        newChildren = newRows
      } else {
        // form/layout children 是一维数组
        const children = node.children as RenderNode[]
        const newChildrenArray: RenderNode[] = []
        for (const child of children) {
          const newChild = this.computeNode(child, computed)
          newChildrenArray.push(newChild)
          if (newChild !== child) {
            childrenChanged = true
          }
        }
        newChildren = newChildrenArray
      }
    }
    // 如果 computed 或 children 改变，创建新节点；否则复用原节点
    if (computedChanged || childrenChanged) {
      return {
        ...node,
        computed,
        children: newChildren
      }
    }

    return node
  }

  /**
   * 构建 Context 上下文
   * @param path - 当前节点路径
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
   * 执行控制属性，返回布尔值
   * @param attr - 控制属性（三种格式之一）
   * @param ctx - Context 上下文
   * @param defaultValue - 默认值
   * @returns 计算后的布尔值
   */
  private executeControlAttr(
    attr: ControlAttr | undefined,
    ctx: Context,
    defaultValue: boolean
  ): boolean {
    // 未定义：返回默认值
    if (attr === undefined) {
      return defaultValue
    }

    // 格式1: boolean
    if (typeof attr === 'boolean') {
      return attr
    }

    // 格式2: function
    if (typeof attr === 'function') {
      try {
        return attr(ctx)
      } catch (error) {
        console.error(
          `Control attr function error at path "${ctx.path}":`,
          error
        )
        return defaultValue
      }
    }

    // 格式3: object { when, deps? }
    if (isPlainObject(attr)) {
      const { when } = attr as any

      if (when === undefined) {
        console.warn(
          `Control attr object at path "${ctx.path}" missing "when" property`
        )
        return defaultValue
      }

      if (typeof when === 'boolean') {
        return when
      }

      if (typeof when === 'function') {
        try {
          return when(ctx)
        } catch (error) {
          console.error(
            `Control attr "when" function error at path "${ctx.path}":`,
            error
          )
          return defaultValue
        }
      }
    }

    // 未知格式
    console.warn(`Unknown control attr format at path "${ctx.path}":`, attr)
    return defaultValue
  }

  /**
   * 根据路径获取 SchemaNode
   * @param renderPath - RenderNode 的路径（包含数组索引）
   * @returns SchemaNode 或 undefined
   */
  private getSchemaByPath(renderPath: string): SchemaNode | undefined {
    // 将 RenderNode path 转换为 Schema path
    // 'list.0.field' → 'list.items.field'
    const schemaPath = this.convertRenderPathToSchemaPath(renderPath)

    // 从 parsedSchema.pathMap 获取
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

    // 将数字索引替换为 'items'
    // 'list.0.field' → 'list.items.field'
    // 'list.0.childList.1.field' → 'list.items.childList.items.field'
    const segments = renderPath.split('.')
    const schemaSegments = segments.map((segment) => {
      // 如果是数字，替换为 'items'
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
   * @returns 行路径，如 'list.0' 或 'list.0.childList.1'
   */
  private getNearestRowPath(path: string): string {
    if (!path) {
      return ''
    }

    const segments = path.split('.')

    // 从后往前找，找到第一个数字
    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        // 返回到该数字为止的路径
        return segments.slice(0, i + 1).join('.')
      }
    }

    return ''
  }

  /**
   * 获取最近一层 list 的行索引
   * @param path - 当前路径
   * @returns 行索引，找不到返回 -1
   */
  private getNearestRowIndex(path: string): number {
    if (!path) {
      return -1
    }

    const segments = path.split('.')

    // 从后往前找，找到第一个数字
    for (let i = segments.length - 1; i >= 0; i--) {
      if (/^\d+$/.test(segments[i])) {
        return parseInt(segments[i], 10)
      }
    }

    return -1
  }
}
