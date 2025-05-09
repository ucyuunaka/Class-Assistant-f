/**
 * 课堂助手 - 扩展主题系统
 * 处理多种渐变主题切换
 */

// 导入通知组件
import { showNotification } from '/components/notifications/notifications.js';

// 文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 初始化主题系统
  ThemeManager.init();
});

// 主题管理器
export const ThemeManager = {
  // 可用的主题列表（渐变组合）
  themes: [
    { id: 'classic-blue-pink', name: '经典蓝粉' },
    { id: 'mint-purple', name: '薄荷紫' },
    { id: 'peach-coral', name: '蜜桃珊瑚' },
    { id: 'green-blue', name: '绿蓝渐变' },
    { id: 'lavender-cream', name: '薰衣草奶油' },
    { id: 'blue-violet', name: '蓝紫渐变' },
    { id: 'coral-mint', name: '珊瑚薄荷' },
    { id: 'sunset', name: '夕阳渐变' },
    { id: 'dark', name: '深色模式' }
  ],
  
  // 当前主题
  currentTheme: 'classic-blue-pink',
  
  // 初始化主题系统
  init: function() {
    // 从本地存储加载主题设置
    this.currentTheme = localStorage.getItem('theme') || 'classic-blue-pink';
    
    // 应用主题
    this.applyTheme(this.currentTheme);
    
    // 设置页面初始化小球主题切换器
    this.initThemeBalls();

    // 添加文档级事件监听，处理动态创建的元素
    this.setupGlobalListeners();

    // 确保在页面加载时更新当前主题显示
    this.updateCurrentThemeDisplay();
  },
  
  // 初始化小球主题切换器
  initThemeBalls: function() {
    const themeBalls = document.querySelectorAll('.theme-ball');
    const currentThemeDisplay = document.getElementById('current-theme');
    
    if (!themeBalls.length) return;
    
    // 更新活动小球状态
    this.updateActiveBall(this.currentTheme);
    
    // 为每个主题小球添加点击事件
    themeBalls.forEach(ball => {
      ball.addEventListener('click', () => {
        const themeId = ball.getAttribute('data-theme');
        this.setTheme(themeId);
        this.updateActiveBall(themeId);
      });
    });
    
    // 初始更新当前主题显示
    if (currentThemeDisplay) {
      this.updateCurrentThemeDisplay();
    }
  },
  
  // 更新主题小球的活动状态
  updateActiveBall: function(themeId) {
    const themeBalls = document.querySelectorAll('.theme-ball');
    
    themeBalls.forEach(ball => {
      if (ball.getAttribute('data-theme') === themeId) {
        ball.classList.add('active');
      } else {
        ball.classList.remove('active');
      }
    });
    
    // 更新当前主题显示
    this.updateCurrentThemeDisplay();
  },

  // 更新当前主题显示
  updateCurrentThemeDisplay: function() {
    const currentThemeDisplay = document.getElementById('current-theme');
    if (currentThemeDisplay) {
      const themeName = this.getThemeName(this.currentTheme);
      currentThemeDisplay.innerHTML = `<span class="theme-dot"></span>当前使用：${themeName}`;
    }
  },
  
  // 设置主题
  setTheme: function(themeId) {
    // 保存到本地存储
    localStorage.setItem('theme', themeId);
    this.currentTheme = themeId;
    
    // 应用主题
    this.applyTheme(themeId);
    // 显示通知
    showNotification(`已切换到${this.getThemeName(themeId)}主题`, 'success');
    
    // 触发主题改变事件
    window.dispatchEvent(
      new CustomEvent('themeChanged', { detail: { theme: themeId } })
    );
  },
  
  // 应用主题到DOM
  applyTheme: function(themeId) {
    // 设置文档主题属性
    document.body.setAttribute('data-theme', themeId);
    document.documentElement.classList.toggle('dark-theme', themeId === 'dark');
    
    // 更新元数据和系统主题色
    this.updateMetaTags(themeId);
    
    // 触发主题改变事件
    window.dispatchEvent(
      new CustomEvent('themeChanged', { detail: { theme: themeId } })
    );
    
    // 应用UI元素主题动态样式
    this.applyUIElementsTheme(themeId);

    // 更新当前主题显示
    this.updateCurrentThemeDisplay();
  },
  
  // 更新移动设备和浏览器的主题元数据
  updateMetaTags: function(themeId) {
    const isDarkTheme = themeId === 'dark';
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const themeInfo = this.getThemeInfo(themeId);
    
    // 更新或创建主题色元标签
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeInfo.startColor);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = themeInfo.startColor;
      document.head.appendChild(meta);
    }
    
    // 设置适合暗色模式的元数据
    document.documentElement.style.colorScheme = isDarkTheme ? 'dark' : 'light';
  },
  
  // 获取主题的颜色信息
  getThemeInfo: function(themeId) {
    const styleVars = getComputedStyle(document.documentElement);
    const theme = this.themes.find(t => t.id === themeId) || this.themes[0];
    
    // 从CSS变量获取颜色
    let startColor = styleVars.getPropertyValue('--gradient-start').trim();
    
    // 无法获取的情况下使用备用颜色
    if (!startColor) {
      switch(themeId) {
        case 'classic-blue-pink': startColor = '#91defe'; break;
        case 'mint-purple': startColor = '#a0e8e0'; break;
        case 'peach-coral': startColor = '#ffd7e8'; break;
        case 'green-blue': startColor = '#d2e8c8'; break;
        case 'lavender-cream': startColor = '#e6c6ff'; break;
        case 'blue-violet': startColor = '#b5d8ff'; break;
        case 'coral-mint': startColor = '#ffb7c5'; break;
        case 'sunset': startColor = '#f9bccc'; break;
        case 'dark': startColor = '#1a1a2e'; break;
        default: startColor = '#91defe';
      }
    }
    
    return {
      name: theme.name,
      startColor: startColor,
      isDark: themeId === 'dark'
    };
  },
  
  // 应用UI元素的主题样式
  applyUIElementsTheme: function(themeId) {
    // 应用按钮样式
    this.updateButtonStyles();
    
    // 应用表单元素样式
    this.updateFormStyles();
    
    // 应用卡片样式
    this.updateCardStyles();
    
    // 应用导航元素样式
    this.updateNavigationStyles();
    
    // 应用其他UI元素样式
    this.updateMiscUIStyles();
  },
  
  // 更新按钮样式
  updateButtonStyles: function() {
    // 这里通过CSS变量应用，不需要额外的代码
    // 所有样式通过主题的CSS变量自动应用
  },
  
  // 更新表单样式
  updateFormStyles: function() {
    // 这里通过CSS变量应用，不需要额外的代码
  },
  
  // 更新卡片样式
  updateCardStyles: function() {
    // 这里通过CSS变量应用，不需要额外的代码
  },
  
  // 更新导航样式
  updateNavigationStyles: function() {
    // 这里通过CSS变量应用，不需要额外的代码
  },
  
  // 更新其他UI元素样式
  updateMiscUIStyles: function() {
    // 这里通过CSS变量应用，不需要额外的代码
  },
  
  // 设置全局事件监听器
  setupGlobalListeners: function() {
    // 监听内容加载事件，处理动态内容
    document.addEventListener('DOMContentLoaded', () => {
      this.applyTheme(this.currentTheme);
    });
    
    // 监听AJAX内容加载后的事件
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver((mutations) => {
        // 当DOM变化时，重新应用主题到新元素
        this.applyUIElementsTheme(this.currentTheme);
      });
      
      // 观察文档的子节点变化
      observer.observe(document.body, { childList: true, subtree: true });
    }
  },
  
  // 获取主题名称
  getThemeName: function(themeId) {
    const theme = this.themes.find(t => t.id === themeId);
    return theme ? theme.name : '默认';
  }
};

/**
 * 切换主题函数 - 返回新的主题ID
 * @returns {string} 新的主题ID
 */
export function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'classic-blue-pink' : 'dark';
  ThemeManager.setTheme(newTheme);
  return newTheme;
}

// 为了向后兼容，仍保留全局对象
window.ThemeManager = ThemeManager;