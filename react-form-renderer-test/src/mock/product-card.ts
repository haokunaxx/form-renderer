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
    componentProps: {
      type: 'card',
      title: '产品信息'
    },
    properties: {
      productCommonPrefix: {
        type: 'field',
        component: 'Input',
        formItemProps: {
          label: '产品前缀'
        }
      },
      productList: {
        type: 'list',
        component: 'list',
        componentProps: {
          title: '产品列表'
        },
        items: {
          name: {
            type: 'field',
            component: 'Input',
            formItemProps: {
              label: '产品名称'
            },
            required: true,
            subscribes: {
              productCommonPrefix: (ctx) => {
                const commonPrefix = ctx.getValue('productCommonPrefix')
                console.log('----commonPrefix', commonPrefix)
                // ctx.updateSelf(commonPrefix + ctx.getValue('name'))
              }
            }
          },
          price: {
            type: 'field',
            component: 'Input',
            formItemProps: {
              label: '产品价格'
            },
            required: true
          },
          quantity: {
            type: 'field',
            component: 'Input',
            formItemProps: {
              label: '产品数量'
            },
            required: true
          },
          total: {
            type: 'field',
            component: 'Input',
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
        component: 'Input',
        formItemProps: {
          label: '总价',
          validateTrigger: 'onChange'
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
