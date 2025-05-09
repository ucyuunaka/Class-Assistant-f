import { defineConfig } from 'vite';
import { resolve } from 'path';
import purgecss from 'vite-plugin-purgecss';
import deadcode from 'vite-plugin-deadcode';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  // 基本路径
  base: './',

  // 构建配置
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser', // 使用terser进行代码压缩
    terserOptions: {
      compress: {
        drop_console: false, // 生产环境是否移除console
      },
    },
    // rollup打包配置
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        schedule: resolve(__dirname, 'pages/schedule.html'),
        settings: resolve(__dirname, 'pages/settings.html'),
        lesson: resolve(__dirname, 'pages/lesson.html'),
        profile: resolve(__dirname, 'pages/profile.html'),
        grades: resolve(__dirname, 'pages/grades.html'),
        countdown: resolve(__dirname, 'pages/countdown.html'),
        login: resolve(__dirname, 'pages/login.html') // 添加 login 入口
      },
      output: {
        manualChunks: {
          // 将第三方依赖库拆分
          vendor: [],
          // 将公共组件拆分
          components: [
            '/components/buttons/buttons.js',
            '/components/footer/footer.js', 
            '/components/header/header.js',
            '/components/modals/modals.js',
            '/components/notifications/notifications.js',
            '/components/scrollAnimation/scrollAnimation.js',
            '/components/sidebar/sidebar.js'
          ],
          // 将主要js文件拆分
          core: [
            '/js/main.js',
            '/js/themes.js',
          ],
        },
      },
    },
  },

  // 服务器配置
  server: {
    port: 3000,
    cors: true, // 允许跨域
  },

  // 解析配置
  resolve: {
    alias: {
      // 设置路径别名
      '@': resolve(__dirname),
      '@components': resolve(__dirname, 'components'),
      '@js': resolve(__dirname, 'js'),
      '@css': resolve(__dirname, 'css'),
      '@pages': resolve(__dirname, 'pages'),
      '@public': resolve(__dirname, 'public'),
    },
  },

  // CSS预处理
  css: {
    preprocessorOptions: {
      // 可以添加样式预处理器配置
    },
  },

  // 插件
  plugins: [
    // 在此添加Vite插件
    purgecss({
      content: ['./index.html', './pages/**/*.html', './components/**/*.js', './js/**/*.js']
    }),
    deadcode({
      patterns: ['./index.html', './pages/**/*.html', './components/**/*.js', './js/**/*.js'],
      output: 'deadcode-report.txt' // 添加输出文件选项
    }),
    visualizer({
      open: true,
      filename: 'stats.html'
    })
  ],

  // 优化依赖
  optimizeDeps: {
    include: [], // 需要预构建的依赖
  },
}); 