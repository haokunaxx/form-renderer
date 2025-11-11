import type {
  ComponentDefinition,
  ComponentType,
  ComponentPreset
} from '../types'

/**
 * 组件注册中心
 * 负责管理所有注册的组件定义，支持单个注册、批量注册和预设注册
 */
export class ComponentRegistry {
  private components: Map<string, ComponentDefinition> = new Map()

  /**
   * 注册单个组件
   */
  register(definition: ComponentDefinition): void {
    this.validateDefinition(definition)
    this.components.set(definition.name, definition)
  }

  /**
   * 批量注册组件
   */
  registerBatch(definitions: ComponentDefinition[]): void {
    definitions.forEach((def) => this.register(def))
  }

  /**
   * 获取组件定义
   */
  get(name: string): ComponentDefinition | undefined {
    return this.components.get(name)
  }

  /**
   * 检查组件是否存在
   */
  has(name: string): boolean {
    return this.components.has(name)
  }

  /**
   * 按类型获取所有组件
   */
  getByType(type: ComponentType): ComponentDefinition[] {
    return Array.from(this.components.values()).filter(
      (def) => def.type === type
    )
  }

  /**
   * 注册组件预设
   */
  registerPreset(preset: ComponentPreset): void {
    // 执行预设的初始化逻辑
    if (preset.setup) {
      preset.setup()
    }

    // 批量注册预设中的组件
    this.registerBatch(preset.components)
  }

  /**
   * 获取所有已注册的组件名称
   */
  getRegisteredNames(): string[] {
    return Array.from(this.components.keys())
  }

  /**
   * 获取所有已注册的组件定义
   */
  getAll(): ComponentDefinition[] {
    return Array.from(this.components.values())
  }

  /**
   * 清空所有注册的组件
   */
  clear(): void {
    this.components.clear()
  }

  /**
   * 注销单个组件
   */
  unregister(name: string): boolean {
    return this.components.delete(name)
  }

  /**
   * 验证组件定义的有效性
   */
  private validateDefinition(definition: ComponentDefinition): void {
    if (!definition.name) {
      throw new Error('Component definition must have a name')
    }

    if (!definition.component) {
      throw new Error(`Component "${definition.name}" must have a component`)
    }

    if (!definition.type) {
      throw new Error(`Component "${definition.name}" must have a type`)
    }

    const validTypes: ComponentType[] = ['field', 'layout', 'list', 'form']
    if (!validTypes.includes(definition.type)) {
      throw new Error(
        `Component "${definition.name}" has invalid type "${definition.type}". ` +
          `Valid types are: ${validTypes.join(', ')}`
      )
    }
  }

  /**
   * 克隆注册表（用于创建隔离的组件环境）
   */
  clone(): ComponentRegistry {
    const cloned = new ComponentRegistry()
    this.components.forEach((def, name) => {
      cloned.components.set(name, { ...def })
    })
    return cloned
  }

  /**
   * 合并另一个注册表（用于组合多个预设）
   */
  merge(other: ComponentRegistry, overwrite = false): void {
    other.components.forEach((def, name) => {
      if (overwrite || !this.components.has(name)) {
        this.components.set(name, def)
      }
    })
  }

  /**
   * 获取注册表统计信息
   */
  getStats(): {
    total: number
    byType: Record<ComponentType, number>
  } {
    const byType: Record<ComponentType, number> = {
      field: 0,
      layout: 0,
      list: 0,
      form: 0
    }

    this.components.forEach((def) => {
      byType[def.type]++
    })

    return {
      total: this.components.size,
      byType
    }
  }
}

/**
 * 创建一个新的组件注册表实例
 */
export function createComponentRegistry(): ComponentRegistry {
  return new ComponentRegistry()
}
