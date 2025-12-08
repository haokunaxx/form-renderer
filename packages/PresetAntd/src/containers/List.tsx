import React from 'react'
import { Button, Space } from 'antd'
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons'

export interface ListProps {
  children?: React.ReactNode
  title?: string
  rows?: any[]
  onAdd?: () => void
  onRemove?: (index: number) => void
  onMove?: (from: number, to: number) => void
  addButtonText?: string
  removeButtonText?: string
  [key: string]: any
}

/**
 * List 容器组件
 * 动态列表支持增删
 */
export const List: React.FC<ListProps> = ({
  children,
  title,
  onAdd,
  onRemove,
  addButtonText = '添加',
  removeButtonText,
  onMove,
  style = {},
  ...rest
}) => {
  return (
    <div
      className="list-container"
      style={{
        ...style,
        marginBottom: '12px'
      }}
      {...rest}
    >
      {title && <h4>{title}</h4>}
      <Space direction="vertical" style={{ width: '100%' }}>
        {React.Children.map(children, (child, index) => (
          <div
            key={index}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}
          >
            <div style={{ flex: 1 }}>{child}</div>
            {onRemove && (
              <Button
                type="text"
                danger
                icon={<MinusCircleOutlined />}
                onClick={() => onRemove(index)}
              >
                {removeButtonText}
              </Button>
            )}
          </div>
        ))}
        {onAdd && (
          <Button type="dashed" onClick={onAdd} block icon={<PlusOutlined />}>
            {addButtonText}
          </Button>
        )}
      </Space>
    </div>
  )
}
