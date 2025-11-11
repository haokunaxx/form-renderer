import {
  NodeType,
  JsonSchemaNode,
  SchemaNode,
  ControlAttr,
  Subscribe,
  SubscribeDeclaration,
  SubscribeHandler
} from '../types'
import { isPlainObject, joinPath } from '../utils'

/**
 * Schema 校验错误
 */
export class SchemaValidationError extends Error {
  constructor(message: string, path?: string) {
    super(path ? `[${path}] ${message}` : message)
    this.name = 'SchemaValidationError'
  }
}

/**
 * 解析后的 Schema 结构
 */
export interface ParsedSchema {
  root: SchemaNode
  propMap: Map<string, SchemaNode[]> // prop 名 → 节点数组（可能有多个同名 prop 在不同容器中）
  pathMap: Map<string, SchemaNode> // 路径 → 节点（唯一）
  subscribes: SubscribeDeclaration[] // 所有订阅声明
}

/**
 * Schema 解析器
 * 负责将 JSON Schema 解析为内部可操作的 Schema Tree
 */
export class SchemaParser {
  /**
   * 解析 JSON Schema
   * @param jsonSchema - 原始 JSON Schema
   * @returns 解析后的 Schema 结构
   * @throws {SchemaValidationError} 当 Schema 格式不合法时
   */
  parse(jsonSchema: any): ParsedSchema {
    // 1. 基础校验
    this.validate(jsonSchema)

    // 2. 构建树
    const root = this.buildTree(jsonSchema, '')

    // 3. 构建索引
    const propMap = this.buildPropMap(root)
    const pathMap = this.buildPathMap(root)

    // 4. 提取订阅
    const subscribes = this.extractSubscribes(root)

    return {
      root,
      propMap,
      pathMap,
      subscribes
    }
  }

  /**
   * 校验 Schema 合法性
   * @param jsonSchema - 待校验的 Schema
   * @throws {SchemaValidationError} 校验失败时抛出
   */
  private validate(jsonSchema: any): void {
    // 必须是对象
    if (!isPlainObject(jsonSchema)) {
      throw new SchemaValidationError('Schema must be a plain object')
    }

    // 根节点必须是 form
    if (jsonSchema.type !== 'form') {
      throw new SchemaValidationError(
        `Root node type must be "form", got "${jsonSchema.type}"`
      )
    }

    // form 必须有 properties
    if (!jsonSchema.properties || !isPlainObject(jsonSchema.properties)) {
      throw new SchemaValidationError('Form node must have "properties" object')
    }
  }

  /**
   * 递归构建 Schema Tree
   * @param node - 当前节点的 JSON Schema
   * @param parentPath - 父路径
   * @param prop - 当前节点的 prop 名
   * @returns 构建的 SchemaNode
   */
  private buildTree(
    node: JsonSchemaNode,
    parentPath: string,
    prop?: string
  ): SchemaNode {
    const type = node.type as NodeType

    // 校验 type
    if (!['form', 'layout', 'list', 'field'].includes(type)) {
      const path = prop
        ? joinPath([parentPath, prop].filter(Boolean))
        : parentPath
      throw new SchemaValidationError(
        `Invalid node type "${type}", must be one of: form, layout, list, field`,
        path
      )
    }

    // 生成路径
    const path = prop
      ? joinPath([parentPath, prop].filter(Boolean))
      : parentPath

    // 构建基础节点
    const schemaNode: SchemaNode = {
      type,
      path,
      prop
    }

    // 处理控制属性
    if (node.required !== undefined) {
      schemaNode.required = this.normalizeControlAttr(node.required)
    }
    if (node.disabled !== undefined) {
      schemaNode.disabled = this.normalizeControlAttr(node.disabled)
    }
    if (node.readonly !== undefined) {
      schemaNode.readonly = this.normalizeControlAttr(node.readonly)
    }
    if (node.ifShow !== undefined) {
      schemaNode.ifShow = this.normalizeControlAttr(node.ifShow)
    }
    if (node.show !== undefined) {
      schemaNode.show = this.normalizeControlAttr(node.show)
    }

    // 处理订阅
    if (node.subscribes !== undefined) {
      schemaNode.subscribes = node.subscribes
    }

    // 处理校验器
    if (node.validators !== undefined) {
      schemaNode.validators = node.validators
    }

    // 处理 UI 相关属性
    if (node.component !== undefined) {
      schemaNode.component = node.component
    }
    if (node.componentProps !== undefined) {
      schemaNode.componentProps = node.componentProps
    }
    if (node.formItemProps !== undefined) {
      schemaNode.formItemProps = node.formItemProps
    }
    if (node.formProps !== undefined) {
      schemaNode.formProps = node.formProps
    }

    // 保留其他自定义属性（排除已处理的已知属性）
    const knownKeys = new Set([
      'type',
      'prop',
      'required',
      'disabled',
      'readonly',
      'ifShow',
      'show',
      'subscribes',
      'validators',
      'properties',
      'items',
      'component',
      'componentProps',
      'formItemProps',
      'formProps'
    ])

    for (const [key, value] of Object.entries(node)) {
      if (!knownKeys.has(key) && value !== undefined) {
        schemaNode[key] = value
      }
    }

    // 根据类型处理子节点
    if (type === 'form' || type === 'layout') {
      // form/layout 必须有 properties
      if (!node.properties || !isPlainObject(node.properties)) {
        throw new SchemaValidationError(
          `${type} node must have "properties" object`,
          path
        )
      }

      // 检查 prop 唯一性
      const props = Object.keys(node.properties)
      const uniqueProps = new Set(props)
      if (props.length !== uniqueProps.size) {
        throw new SchemaValidationError(
          'Duplicate prop names in properties',
          path
        )
      }

      // 递归构建子节点
      schemaNode.properties = {}
      // layout 只是 UI 容器，不影响数据路径，其子节点应该使用父级路径
      const childrenParentPath = type === 'layout' ? parentPath : path
      for (const [childProp, childNode] of Object.entries(node.properties)) {
        schemaNode.properties[childProp] = this.buildTree(
          childNode as JsonSchemaNode,
          childrenParentPath,
          childProp
        )
      }
    } else if (type === 'list') {
      // list 必须有 items
      if (!node.items || !isPlainObject(node.items)) {
        throw new SchemaValidationError(
          'list node must have "items" object',
          path
        )
      }

      // 检查 items 中的 prop 唯一性
      const props = Object.keys(node.items)
      const uniqueProps = new Set(props)
      if (props.length !== uniqueProps.size) {
        throw new SchemaValidationError('Duplicate prop names in items', path)
      }

      // 递归构建 items（使用 "items" 作为路径段）
      schemaNode.items = {}
      const itemsPath = joinPath([path, 'items'])
      for (const [childProp, childNode] of Object.entries(node.items)) {
        schemaNode.items[childProp] = this.buildTree(
          childNode as JsonSchemaNode,
          itemsPath,
          childProp
        )
      }
    } else if (type === 'field') {
      // field 不能有 properties 或 items
      if (node.properties) {
        throw new SchemaValidationError(
          'field node cannot have "properties"',
          path
        )
      }
      if (node.items) {
        throw new SchemaValidationError('field node cannot have "items"', path)
      }
    }
    return schemaNode
  }

  /**
   * 构建 PropMap（prop → SchemaNode[]）
   * 注意：同一个 prop 名可能在不同容器中出现多次
   */
  private buildPropMap(root: SchemaNode): Map<string, SchemaNode[]> {
    const propMap = new Map<string, SchemaNode[]>()

    const traverse = (node: SchemaNode) => {
      // 记录有 prop 的节点
      if (node.prop) {
        if (!propMap.has(node.prop)) {
          propMap.set(node.prop, [])
        }
        propMap.get(node.prop)!.push(node)
      }

      // 递归遍历子节点
      if (node.properties) {
        Object.values(node.properties).forEach(traverse)
      }
      if (node.items) {
        Object.values(node.items).forEach(traverse)
      }
    }

    traverse(root)
    return propMap
  }

  /**
   * 构建 PathMap（path → SchemaNode）
   * 路径是唯一的
   */
  private buildPathMap(root: SchemaNode): Map<string, SchemaNode> {
    const pathMap = new Map<string, SchemaNode>()

    const traverse = (node: SchemaNode) => {
      // 记录路径
      pathMap.set(node.path, node)

      // 递归遍历子节点
      if (node.properties) {
        Object.values(node.properties).forEach(traverse)
      }
      if (node.items) {
        Object.values(node.items).forEach(traverse)
      }
    }

    traverse(root)
    return pathMap
  }

  /**
   * 提取所有订阅声明
   */
  private extractSubscribes(root: SchemaNode): SubscribeDeclaration[] {
    const result: SubscribeDeclaration[] = []

    const traverse = (node: SchemaNode) => {
      // 提取当前节点的订阅
      if (node.subscribes) {
        // 处理对象格式：{ target: handler | { handler, ... } }
        if (isPlainObject(node.subscribes)) {
          Object.entries(node.subscribes).forEach(([target, subscribe]) => {
            // 检查是否包含逗号（多字段订阅）
            if (target.includes(',')) {
              // 拆分为多个 target
              const targets = target
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)

              // 为每个 target 创建订阅声明
              targets.forEach((singleTarget) => {
                result.push(
                  this.normalizeSubscribe(node, singleTarget, subscribe)
                )
              })
            } else {
              // 单字段订阅，保持原有逻辑
              result.push(this.normalizeSubscribe(node, target, subscribe))
            }
          })
        }
        // 处理数组格式：[{ target, handler, ... }]
        else if (Array.isArray(node.subscribes)) {
          node.subscribes.forEach((item) => {
            if (!item.target) {
              throw new SchemaValidationError(
                'Subscribe item must have "target" property',
                node.path
              )
            }

            // 数组格式也支持逗号分隔
            if (item.target.includes(',')) {
              const targets = item.target
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)

              targets.forEach((singleTarget) => {
                result.push(this.normalizeSubscribe(node, singleTarget, item))
              })
            } else {
              result.push(this.normalizeSubscribe(node, item.target, item))
            }
          })
        }
      }

      // 递归遍历子节点
      if (node.properties) {
        Object.values(node.properties).forEach(traverse)
      }
      if (node.items) {
        Object.values(node.items).forEach(traverse)
      }
    }

    traverse(root)
    return result
  }

  /**
   * 规范化单个订阅声明
   */
  private normalizeSubscribe(
    node: SchemaNode,
    target: string,
    subscribe: Subscribe | any
  ): SubscribeDeclaration {
    let handler: SubscribeHandler
    let options: any = {}

    // 如果是函数，直接作为 handler
    if (typeof subscribe === 'function') {
      handler = subscribe
    }
    // 如果是对象，提取 handler 和其他选项
    else if (isPlainObject(subscribe)) {
      if (!subscribe.handler || typeof subscribe.handler !== 'function') {
        throw new SchemaValidationError(
          'Subscribe object must have a "handler" function',
          node.path
        )
      }
      handler = subscribe.handler

      // 提取其他选项（排除 handler 和 target）
      const { handler: _, target: __, ...rest } = subscribe
      options = rest
    } else {
      throw new SchemaValidationError(
        'Subscribe must be a function or an object with handler',
        node.path
      )
    }
    return {
      subscriberPath: node.path,
      subscriberProp: node.prop,
      target,
      handler,
      options: Object.keys(options).length > 0 ? options : undefined
    }
  }

  /**
   * 规范化控制属性
   * 支持三种格式：boolean | function | { when, deps? }
   */
  private normalizeControlAttr(attr: any): ControlAttr {
    // 布尔值
    if (typeof attr === 'boolean') {
      return attr
    }

    // 函数
    if (typeof attr === 'function') {
      return attr
    }

    // 对象格式
    if (isPlainObject(attr)) {
      if (attr.when === undefined) {
        throw new SchemaValidationError(
          'Control attribute object must have "when" property'
        )
      }

      // when 必须是 boolean 或 function
      if (typeof attr.when !== 'boolean' && typeof attr.when !== 'function') {
        throw new SchemaValidationError(
          'Control attribute "when" must be boolean or function'
        )
      }

      // deps 如果存在必须是数组
      if (attr.deps !== undefined && !Array.isArray(attr.deps)) {
        throw new SchemaValidationError(
          'Control attribute "deps" must be an array'
        )
      }

      return attr as ControlAttr
    }

    throw new SchemaValidationError(
      'Control attribute must be boolean, function, or object with "when" property'
    )
  }
}
