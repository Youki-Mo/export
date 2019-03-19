// https://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint'
  },
  env: {
    browser: true,
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    'plugin:vue/essential', 
    // https://github.com/standard/standard/blob/master/docs/RULES-en.md
    'standard'
  ],
  // required to lint *.vue files
  plugins: [
    'vue'
  ],
  // add your custom rules here
  // 关闭规则: 'off' or 0
  // 警告规则：'warn' or 1
  // 错误规则: 'error' or 2
  rules: {
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    // 不允许使用双等号
    'eqeqeq': 2,
    // 禁止扩展原生类型原型，需要
    'no-extend-native': 2,
    // 文件最后需要另起一行空的行，不需要
    'eol-last': 0,
    // 强制在点号之前和之后一致的换行
    'dot-location': 0,
    // 缩进距离为4格空格
    'indent': [2, 4, { "SwitchCase": 1 }],
    // 函数()前不需要空格
    'space-before-function-paren': [2, 'never'],
    /** 
     * @name one-var
     * @description 强制变量在函数中一起或单独声明
     * @param always 每个范围需要一个变量声明（默认）
     * @param never 每个范围需要多个变量声明
     * @param consecutive 允许每个范围有多个变量声明，但需要将连续变量声明组合成单个声明
     */
    'one-var': 0,
    //语句强制分号结尾
    "semi": [2, "always"],
    // 禁止使用空解构对象
    'no-empty-pattern': 0,
    // 在条件表达式中禁止使用布尔值
    'no-unneeded-ternary': 0
}
}
