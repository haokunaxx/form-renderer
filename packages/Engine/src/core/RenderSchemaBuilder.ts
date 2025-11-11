import { SchemaNode, RenderNode } from '../types'
import { ModelManager } from './ModelManager'

/**
 * RenderSchemaBuilder 错误类
 */
export class RenderSchemaBuilderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RenderSchemaBuilderError'
  }
}

/**
 * 渲染 Schema 生成器
 * 负责将 ParsedSchema + FormModel 转换为 RenderSchema
 */
export class RenderSchemaBuilder {
  private modelManager: ModelManager

  /**
   * 构造函数
   * @param modelManager - FormModel 管理器
   */
  constructor(modelManager: ModelManager) {
    this.modelManager = modelManager
  }

  /**
   * 构建渲染 Schema
   * @param root - ParsedSchema 的根节点
   * @returns 渲染 Schema 的根节点
   */
  build(root: SchemaNode): RenderNode {
    if (root.type !== 'form') {
      throw new RenderSchemaBuilderError('Root node must be of type "form"')
    }

    return this.buildNode(root, '')
  }

  /**
   * 递归构建节点
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前路径（实际数据路径）
   * @returns 渲染节点
   */
  private buildNode(schemaNode: SchemaNode, currentPath: string): RenderNode {
    const { type } = schemaNode

    switch (type) {
      case 'form':
      case 'layout':
        return this.buildContainerNode(schemaNode, currentPath)
      case 'list':
        return this.buildListNode(schemaNode, currentPath)
      case 'field':
        return this.buildFieldNode(schemaNode, currentPath)
      default:
        throw new RenderSchemaBuilderError(`Unknown node type: ${type}`)
    }
  }

  /**
   * 构建容器节点 (form/layout)
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前路径
   * @returns 渲染节点
   */
  private buildContainerNode(
    schemaNode: SchemaNode,
    currentPath: string
  ): RenderNode {
    const children: RenderNode[] = []

    // 确定子节点的路径前缀
    // layout 只是 UI 容器，不影响数据路径，其子节点应该使用父级的数据路径
    let childrenPathPrefix: string
    if (schemaNode.type === 'layout') {
      // 从 currentPath 中移除最后一段（即 layout 自己的 prop）
      const segments = currentPath.split('.').filter((s) => s)
      segments.pop() // 移除最后一段
      childrenPathPrefix = segments.join('.')
    } else {
      childrenPathPrefix = currentPath
    }

    // 遍历 properties，转为 children 数组
    if (schemaNode.properties) {
      for (const [prop, childSchema] of Object.entries(schemaNode.properties)) {
        const childPath = childrenPathPrefix
          ? `${childrenPathPrefix}.${prop}`
          : prop
        const childNode = this.buildNode(childSchema, childPath)
        children.push(childNode)
      }
    }

    // 构建基础节点
    const renderNode: RenderNode = {
      type: schemaNode.type,
      path: currentPath,
      children
    }

    // 添加 prop（form 没有 prop）
    if (schemaNode.prop) {
      renderNode.prop = schemaNode.prop
    }

    // 复制控制属性（保持原始格式，不计算）
    if (schemaNode.required !== undefined) {
      renderNode.required = schemaNode.required
    }
    if (schemaNode.disabled !== undefined) {
      renderNode.disabled = schemaNode.disabled
    }
    if (schemaNode.readonly !== undefined) {
      renderNode.readonly = schemaNode.readonly
    }
    if (schemaNode.ifShow !== undefined) {
      renderNode.ifShow = schemaNode.ifShow
    }
    if (schemaNode.show !== undefined) {
      renderNode.show = schemaNode.show
    }

    // 复制 UI 属性
    if (schemaNode.component !== undefined) {
      renderNode.component = schemaNode.component
    }
    if (schemaNode.componentProps !== undefined) {
      renderNode.componentProps = schemaNode.componentProps
    }
    if (schemaNode.formItemProps !== undefined) {
      renderNode.formItemProps = schemaNode.formItemProps
    }

    if (schemaNode.formProps !== undefined) {
      renderNode.formProps = schemaNode.formProps
    }

    // 复制 validators
    if (schemaNode.validators !== undefined) {
      renderNode.validators = schemaNode.validators
    }

    // 复制其他自定义属性
    this.copyCustomAttributes(schemaNode, renderNode)

    return renderNode
  }

  /**
   * 构建列表节点
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前路径
   * @returns 渲染节点
   */
  private buildListNode(
    schemaNode: SchemaNode,
    currentPath: string
  ): RenderNode {
    if (!schemaNode.items) {
      throw new RenderSchemaBuilderError(
        `List node at path "${currentPath}" must have items`
      )
    }

    // 获取 list 对应的数组数据
    const listData = this.modelManager.getValue(currentPath)

    // 确定数组长度
    let arrayLength = 0
    if (Array.isArray(listData)) {
      arrayLength = listData.length
    }
    // 如果 listData 不是数组或不存在，arrayLength 为 0

    // 为每一行生成 RenderNode[]
    const children: RenderNode[][] = []
    for (let i = 0; i < arrayLength; i++) {
      const row = this.buildListRow(schemaNode.items, currentPath, i)
      children.push(row)
    }

    // 构建基础节点
    const renderNode: RenderNode = {
      type: 'list',
      path: currentPath,
      children
    }

    // 添加 prop
    if (schemaNode.prop) {
      renderNode.prop = schemaNode.prop
    }

    // 复制控制属性
    if (schemaNode.required !== undefined) {
      renderNode.required = schemaNode.required
    }
    if (schemaNode.disabled !== undefined) {
      renderNode.disabled = schemaNode.disabled
    }
    if (schemaNode.readonly !== undefined) {
      renderNode.readonly = schemaNode.readonly
    }
    if (schemaNode.ifShow !== undefined) {
      renderNode.ifShow = schemaNode.ifShow
    }
    if (schemaNode.show !== undefined) {
      renderNode.show = schemaNode.show
    }

    // 复制 UI 属性
    if (schemaNode.component !== undefined) {
      renderNode.component = schemaNode.component
    }
    if (schemaNode.componentProps !== undefined) {
      renderNode.componentProps = schemaNode.componentProps
    }
    if (schemaNode.formItemProps !== undefined) {
      renderNode.formItemProps = schemaNode.formItemProps
    }

    // 复制 validators
    if (schemaNode.validators !== undefined) {
      renderNode.validators = schemaNode.validators
    }

    // 复制其他自定义属性
    this.copyCustomAttributes(schemaNode, renderNode)

    return renderNode
  }

  /**
   * 构建 list 的单行
   * @param itemsSchema - items 的 Schema（Record 格式）
   * @param listPath - list 的路径
   * @param rowIndex - 行索引
   * @returns 该行的 RenderNode 数组
   */
  private buildListRow(
    itemsSchema: Record<string, SchemaNode>,
    listPath: string,
    rowIndex: number
  ): RenderNode[] {
    const row: RenderNode[] = []

    for (const [prop, childSchema] of Object.entries(itemsSchema)) {
      // 构建实际路径：list.0.field
      const childPath = `${listPath}.${rowIndex}.${prop}`

      // 递归构建子节点
      const childNode = this.buildNodeForListItem(
        childSchema,
        childPath,
        rowIndex
      )
      row.push(childNode)
    }

    return row
  }

  /**
   * 为 list item 构建节点（需要处理路径替换）
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前实际路径（已包含行索引）
   * @param rowIndex - 行索引
   * @returns 渲染节点
   */
  private buildNodeForListItem(
    schemaNode: SchemaNode,
    currentPath: string,
    rowIndex: number
  ): RenderNode {
    const { type } = schemaNode

    switch (type) {
      case 'layout':
        return this.buildContainerNodeForListItem(
          schemaNode,
          currentPath,
          rowIndex
        )
      case 'list':
        return this.buildListNode(schemaNode, currentPath)
      case 'field':
        return this.buildFieldNode(schemaNode, currentPath)
      default:
        throw new RenderSchemaBuilderError(`Unknown node type: ${type}`)
    }
  }

  /**
   * 为 list item 构建容器节点
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前实际路径
   * @param rowIndex - 行索引
   * @returns 渲染节点
   */
  private buildContainerNodeForListItem(
    schemaNode: SchemaNode,
    currentPath: string,
    rowIndex: number
  ): RenderNode {
    const children: RenderNode[] = []

    // 确定子节点的路径前缀
    // layout 只是 UI 容器，不影响数据路径
    let childrenPathPrefix: string
    if (schemaNode.type === 'layout') {
      // 从 currentPath 中移除最后一段（即 layout 自己的 prop）
      const segments = currentPath.split('.').filter((s) => s)
      segments.pop()
      childrenPathPrefix = segments.join('.')
    } else {
      childrenPathPrefix = currentPath
    }

    // 遍历 properties
    if (schemaNode.properties) {
      for (const [prop, childSchema] of Object.entries(schemaNode.properties)) {
        const childPath = childrenPathPrefix
          ? `${childrenPathPrefix}.${prop}`
          : prop
        const childNode = this.buildNodeForListItem(
          childSchema,
          childPath,
          rowIndex
        )
        children.push(childNode)
      }
    }

    // 构建基础节点
    const renderNode: RenderNode = {
      type: schemaNode.type,
      path: currentPath,
      children
    }

    // 添加 prop
    if (schemaNode.prop) {
      renderNode.prop = schemaNode.prop
    }

    // 复制所有属性
    this.copyNodeAttributes(schemaNode, renderNode)

    return renderNode
  }

  /**
   * 构建字段节点
   * @param schemaNode - Schema 节点
   * @param currentPath - 当前路径
   * @returns 渲染节点
   */
  buildFieldNode(schemaNode: SchemaNode, currentPath: string): RenderNode {
    // 构建基础节点
    const renderNode: RenderNode = {
      type: 'field',
      path: currentPath
    }

    // 添加 prop
    if (schemaNode.prop) {
      renderNode.prop = schemaNode.prop
    }

    // 复制所有属性
    this.copyNodeAttributes(schemaNode, renderNode)

    return renderNode
  }

  /**
   * 复制节点的所有属性（控制属性、UI 属性、validators 等）
   * @param source - 源节点
   * @param target - 目标节点
   */
  private copyNodeAttributes(source: SchemaNode, target: RenderNode): void {
    // 复制控制属性
    if (source.required !== undefined) {
      target.required = source.required
    }
    if (source.disabled !== undefined) {
      target.disabled = source.disabled
    }
    if (source.readonly !== undefined) {
      target.readonly = source.readonly
    }
    if (source.ifShow !== undefined) {
      target.ifShow = source.ifShow
    }
    if (source.show !== undefined) {
      target.show = source.show
    }

    // 复制 UI 属性
    if (source.component !== undefined) {
      target.component = source.component
    }
    if (source.componentProps !== undefined) {
      target.componentProps = source.componentProps
    }
    if (source.formItemProps !== undefined) {
      target.formItemProps = source.formItemProps
    }

    // 复制 validators
    if (source.validators !== undefined) {
      target.validators = source.validators
    }

    // 复制其他自定义属性
    this.copyCustomAttributes(source, target)
  }

  /**
   * 复制自定义属性（排除已知属性）
   * @param source - 源对象
   * @param target - 目标对象
   */
  private copyCustomAttributes(source: any, target: any): void {
    const knownKeys = new Set([
      'type',
      'prop',
      'path',
      'required',
      'disabled',
      'readonly',
      'ifShow',
      'show',
      'subscribes',
      'validators',
      'properties',
      'items',
      'children',
      'component',
      'componentProps',
      'formItemProps',
      'formProps',
      'computed'
    ])

    for (const [key, value] of Object.entries(source)) {
      if (!knownKeys.has(key) && value !== undefined) {
        target[key] = value
      }
    }
  }
}
