export const JobInformationSchema = {
  jobInformation: {
    type: 'layout',
    component: 'layout',
    componentProps: {
      type: 'card',
      header: '工作信息'
    },
    properties: {
      // 是否在职
      isWorking: {
        type: 'field',
        component: 'switch',
        formItemProps: {
          label: '是否在职'
        }
      },
      // 当前工作城市
      currentWorkCity: {
        type: 'field',
        component: 'select',
        disabled: (ctx) => !ctx.getValue('isWorking'),
        componentProps: {
          options: [
            { label: '北京', value: 'beijing' },
            { label: '上海', value: 'shanghai' },
            { label: '广州', value: 'guangzhou' },
            { label: '深圳', value: 'shenzhen' }
          ]
        },
        formItemProps: {
          label: '当前工作城市'
        },
        subscribes: {
          isWorking: (ctx) => {
            if (!ctx.getValue('isWorking')) {
              ctx.updateSelf('')
            }
          }
        }
      },
      // 当前年收入
      currentAnnualIncome: {
        type: 'field',
        component: 'input',
        disabled: (ctx) => !ctx.getValue('isWorking'),
        formItemProps: {
          label: '当前年收入'
        },
        subscribes: {
          isWorking: (ctx) => {
            if (!ctx.getValue('isWorking')) {
              ctx.updateSelf('')
            }
          }
        }
      }
    }
  }
}

export const JobInformationModel = {
  isWorking: false,
  currentWorkCity: '',
  currentAnnualIncome: ''
}
