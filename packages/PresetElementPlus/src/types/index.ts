// 预设相关类型定义
export interface ElementPlusPresetConfig {
  // 预设配置选项
  theme?: 'default' | 'dark'
  size?: 'large' | 'default' | 'small'
  locale?: string
}

// 字段组件通用Props
export interface FieldComponentProps {
  modelValue?: any
  onChange?: (value: any) => void
  readonly?: boolean
  disabled?: boolean
  placeholder?: string
  [key: string]: any
}

// 容器组件通用Props
export interface ContainerComponentProps {
  children?: any[]
  [key: string]: any
}

// 预设创建函数返回类型
export interface ElementPlusPreset {
  name: string
  version: string
  widgets: Record<string, any>
  containers: Record<string, any>
  wrappers: Record<string, any>
}
