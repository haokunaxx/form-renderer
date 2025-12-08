import { useCallback } from 'react'
import type { FieldComponentProps } from '../types'

/**
 * useFieldComponent Hook
 * 提供字段组件开发的辅助功能
 */
export function useFieldComponent(props: FieldComponentProps) {
  const { value, disabled, readOnly, onChange, onFocus, onBlur } = props

  // 处理值变化
  const handleChange = useCallback(
    (newValue: any) => {
      if (onChange) {
        onChange(newValue)
      }
    },
    [onChange]
  )

  // 处理聚焦
  const handleFocus = useCallback(
    (event: any) => {
      if (onFocus) {
        onFocus(event)
      }
    },
    [onFocus]
  )

  // 处理失焦
  const handleBlur = useCallback(
    (event: any) => {
      if (onBlur) {
        onBlur(event)
      }
    },
    [onBlur]
  )

  return {
    value,
    disabled,
    readOnly,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur
  }
}
