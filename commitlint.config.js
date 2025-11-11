module.exports = {
  extends: ['cz', '@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'refactor',
        'perf',
        'optimization',
        'style',
        'test',
        'anno',
        'build',
        'ci',
        'chore',
        'revert'
      ]
    ]
  }
}

/**
 * feat : 新功能
 * fix : 修复bug
 * docs : 文档改变
 * refactor : 某个已有功能重构
 * perf : 性能优化
 * optimization : 其他优化
 * style : 代码格式改变
 * test : 增加测试
 * anno: 增加注释
 * build : 改变了build工具 如 webpack
 * ci : 持续集成新增
 * chore : 构建过程或辅助工具的变动
 * revert : 撤销上一次的 commit
 */
