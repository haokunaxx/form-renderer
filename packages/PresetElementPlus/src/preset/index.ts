import type { ElementPlusPresetConfig, ElementPlusPreset } from '../types'
import * as widgets from '../widgets'
import * as containers from '../containers'
import * as wrappers from '../wrappers'

/**
 * 创建 ElementPlus 预设
 * @param config 预设配置
 * @returns ElementPlus 预设对象
 */
export function createElementPlusPreset(
  _: ElementPlusPresetConfig = {}
): ElementPlusPreset {
  return {
    name: '@form-renderer/preset-element-plus',
    version: '0.1.0',
    widgets,
    containers,
    wrappers
  }
}

export type { ElementPlusPresetConfig, ElementPlusPreset }
