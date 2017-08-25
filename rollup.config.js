import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';

export default {
  output: {
    file: pkg.main,
    format: 'cjs',
    banner: '#!/usr/bin/env node'
  },
  plugins: [nodeResolve(), commonjs()],
  external: [],
  input: pkg.module
};
