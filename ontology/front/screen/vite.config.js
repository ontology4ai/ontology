import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 生产环境打包配置
  build: {
    rollupOptions: {
      external: ['global'],
      output: {
        globals: {
          global: 'window'
        }
      }
    }
  },
  
  // 开发环境解析配置（必须添加）
  resolve: {
    alias: {
      // 开发时将 'global' 模块映射到 window 对象
      global: new URL('./src/global-alias.js', import.meta.url).pathname
    }
  },
  server: {
    // 开发服务器端口
    port: 5173,
    // 自动打开浏览器
    open: true,
    // 允许外部访问
    host: '0.0.0.0',
    // 代理配置
    proxy: {
      // 代理所有以 /api 开头的请求
      '/ontology_show': {
        // 目标服务器地址
        target: 'http://10.1.206.136:9581',
        // 允许跨域
        changeOrigin: true,
        // 不验证SSL证书（仅开发环境）
        secure: false,
        // 重写路径，去掉 /api 前缀
        // rewrite: (path) => path.replace(/^\/api/, ''),
        // 配置WebSocket代理
        ws: true,
        // 自定义请求头
        headers: {
          'X-Requested-With': 'XMLHttpRequest'
        }
      },
    }
  }
})
