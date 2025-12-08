import React from 'react'
import { Card, Space } from 'antd'

export interface LayoutProps {
  children?: React.ReactNode
  title?: string
  type?: 'card' | 'space' | 'div'
  direction?: 'horizontal' | 'vertical'
  [key: string]: any
}

/**
 * Layout 容器组件
 * 支持多种布局类型
 */
export const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  type = 'div',
  direction = 'vertical',
  ...rest
}) => {
  if (type === 'card') {
    return (
      <div style={{ marginBottom: '12px' }}>
        <Card title={title} {...rest}>
          {children}
        </Card>
      </div>
    )
  }

  if (type === 'space') {
    return (
      <Space direction={direction} {...rest}>
        {children}
      </Space>
    )
  }

  return (
    <div className="layout-container" {...rest}>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  )
}
