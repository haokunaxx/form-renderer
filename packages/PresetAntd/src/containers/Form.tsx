import React from 'react'
import { Form as AntdForm } from 'antd'

export interface FormProps {
  children?: React.ReactNode
  labelWidth?: string | number
  labelAlign?: 'left' | 'right'
  layout?: 'horizontal' | 'vertical' | 'inline'
  [key: string]: any
}

/**
 * Form 容器组件
 * 包装 Ant Design 的 Form 组件
 */
export const Form: React.FC<FormProps> = ({
  children,
  labelWidth,
  labelAlign,
  layout = 'horizontal',
  ...rest
}) => {
  return (
    <AntdForm
      layout={layout}
      labelAlign={labelAlign}
      labelCol={labelWidth ? { style: { width: labelWidth } } : undefined}
      {...rest}
    >
      {children}
    </AntdForm>
  )
}
