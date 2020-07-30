module.exports = {
    env: {
        commonjs: true,
        es2020: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/eslint-recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:react/recommended',
    ],
    parserOptions: {
        ecmaVersion: 11,
    },
    plugins: ['@typescript-eslint/eslint-plugin', 'react'],
    rules: {
        indent: ['error', 4, {
            SwitchCase: 1,
        }],
        'no-console': 0,
        'no-shadow': 0,
        'no-param-reassign': 0,
        'arrow-body-style': ['error', 'always'],
        'no-plusplus': 0,
        '@typescript-eslint/no-empty-interface': 0,
        '@typescript-eslint/no-explicit-any': 0,
    },
};
