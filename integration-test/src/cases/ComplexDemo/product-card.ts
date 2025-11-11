// 行内一对一，外部一对多
import type {
  JsonSchemaNode,
  SubscribeHandlerContext
} from '@form-renderer/engine'

const totalSubscribeHandler = (ctx: SubscribeHandlerContext) => {
  const rowData = ctx.getCurRowValue()
  const { price, quantity } = rowData
  if (isNaN(price) || isNaN(quantity)) return
  ctx.updateSelf(price * quantity)
}

export const ProductCardSchema: JsonSchemaNode['properties'] = {
  productCard: {
    type: 'layout',
    component: 'layout',
    properties: {
      productList: {
        type: 'list',
        component: 'list',
        label: '产品列表',
        items: {
          name: {
            type: 'field',
            component: 'input',
            formItemProps: {
              label: '产品名称'
            },
            required: true
          },
          price: {
            type: 'field',
            component: 'input',
            formItemProps: {
              label: '产品价格'
            },
            required: true
          },
          quantity: {
            type: 'field',
            component: 'input',
            formItemProps: {
              label: '产品数量'
            },
            required: true
          },
          total: {
            type: 'field',
            component: 'input',
            formItemProps: {
              label: '小计'
            },
            disabled: true,
            subscribes: {
              // '.price': totalSubscribeHandler,
              // '.quantity': totalSubscribeHandler
              // Or
              '.price,.quantity': totalSubscribeHandler
            }
          }
        }
      },
      totalPrice: {
        type: 'field',
        component: 'input',
        formItemProps: {
          label: '总价'
        },
        required: true,
        subscribes: {
          'productList.*.total': (ctx) => {
            const productList = ctx.getValue('productList')
            const total = productList.reduce(
              (
                sum: number,
                item: {
                  total: number | string
                }
              ) => sum + +item.total,
              0
            )
            ctx.updateSelf(total)
          }
        }
      }
    }
  }
}

export const ProductCardModel = {
  productList: [],
  totalPrice: 0
}
