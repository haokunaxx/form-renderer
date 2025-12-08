import { FormAdapter } from '@form-renderer/adapter-react'

import { ComplexDemoSchema, ComplexDemoModel } from './mock/index'
import { AntdPreset } from '@form-renderer/preset-antd'
function App() {
  return (
    <div style={{ width: '520px', margin: '0 auto' }}>
      <FormAdapter
        schema={ComplexDemoSchema}
        model={ComplexDemoModel}
        components={AntdPreset}
      />
    </div>
  )
}

export default App
