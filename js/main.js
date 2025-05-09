/**
 * 课堂助手 - 主要JavaScript文件
 * 处理全局功能，如导航菜单、主题切换等
 */

// 导入通知组件
import { showNotification } from '/components/notifications/notifications.js';

// 文档加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
  // 初始化
  initTheme();
  if (document.querySelector('.nav-toggle')) {
    initNavbar();
  }
});

/**
 * 初始化导航栏响应式功能
 */
export function initNavbar() {
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  
  // 如果找到了导航切换按钮和链接容器
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function() {
      // 切换导航菜单的显示/隐藏
      navLinks.classList.toggle('active');
    });
    
    // 移动端的兼容
    const links = document.querySelectorAll('.nav-links a');
    links.forEach(link => {
      link.addEventListener('click', function() {

        if (window.innerWidth <= 768) {
          navLinks.classList.remove('active');
        }
      });
    });
    
    // 点击页面其他地方关闭导航菜单
    document.addEventListener('click', function(event) {
      const isNavbarClick = event.target.closest('.navbar-container');
      if (!isNavbarClick && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
      }
    });
    
    // 窗口大小改变时处理
    window.addEventListener('resize', function() {
      if (window.innerWidth > 768) {
        navLinks.classList.remove('active');
      }
    });
  }
}

/**
 * 初始化主题设置
 * 读取本地存储的主题偏好，并应用到页面
 */
export function initTheme() {
  // 本地存储中获取主题
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    document.body.setAttribute('data-theme', 'dark');
  } else {
    document.body.setAttribute('data-theme', 'light');
  }
  const fontScale = localStorage.getItem('fontScale');
  if (fontScale) {
    document.documentElement.style.fontSize = `${fontScale}rem`;
  }
  
  // 监听主题变化事件（用于从设置页面切换主题时）
  window.addEventListener('themeChanged', function(e) {
    document.body.setAttribute('data-theme', e.detail.theme);
  });
}

/**
 * 切换主题
 * 在亮色和暗色主题之间切换
 */
export function toggleTheme() {
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  // 更新DOM
  document.body.setAttribute('data-theme', newTheme);
  
  // 存储设置
  localStorage.setItem('theme', newTheme);
  // 触发主题改变事件，便于其他组件响应
  window.dispatchEvent(
    new CustomEvent('themeChanged', { detail: { theme: newTheme } })
  );
  
  // 显示通知
  showNotification(`已切换到${newTheme === 'dark' ? '暗色' : '亮色'}主题`, 'info');
  return newTheme;
}

/**
 * 格式化日期
 * @param {Date} date - 日期对象
 * @param {string} format - 格式字符串，例如 'YYYY-MM-DD'
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD') {
  if (!date) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

/**
 * 获取URL参数
 * @param {string} name - 参数名
 * @returns {string|null} 参数值，如果不存在则返回null
 */
export function getURLParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

/**
 * 防抖函数
 * @param {Function} func - 要执行的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 经过防抖处理的函数
 */
export function debounce(func, delay = 300) {
  let timer = null;
  return function(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * 计算倒计时
 * @param {Date|string} targetDate - 目标日期
 * @returns {Object} 包含天、时、分、秒的对象
 */
export function calculateCountdown(targetDate) {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  const now = new Date();
  
  // 计算差值（毫秒）
  let diff = target - now;
  
  // 如果目标时间已过，返回零
  if (diff < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  // 计算各单位时间
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}

/**
 * 简单的数据存储API，基于localStorage
 */
export const Storage = {
  /**
   * 保存数据
   * @param {string} key - 键
   * @param {any} value - 值
   */
  save: function(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
    }
  },
  
  /**
   * 获取数据
   * @param {string} key - 键
   * @param {any} defaultValue - 如果不存在时返回的默认值
   * @returns {any} 存储的值或默认值
   */
  get: function(key, defaultValue = null) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      return JSON.parse(value);
    } catch (e) {
      return defaultValue;
    }
  },
  
  /**
   * 移除数据
   * @param {string} key - 键
   */
  remove: function(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
    }
  },
  
  /**
   * 清除所有数据
   */
  clear: function() {
    try {
      localStorage.clear();
    } catch (e) {
    }
  }
};

/**
 * 语言翻译功能
 */
export const Translator = {
  translations: {},
  currentLanguage: 'zh',
  
  /**
   * 初始化翻译功能
   * @param {string} language - 初始语言
   */
  init: function(language = 'zh') {
    this.currentLanguage = language || Storage.get('language', 'zh');
    this.loadTranslations(this.currentLanguage)
      .then(() => this.applyTranslations())
      .catch(error => {
      });
  },
  
  /**
   * 加载翻译数据
   * @param {string} language - 语言代码
   * @returns {Promise} 加载完成的Promise
   */
  loadTranslations: function(language) {
    return new Promise((resolve, reject) => {
      // 如果已经加载过该语言的翻译
      if (this.translations[language]) {
        resolve();
        return;
      }
      
      // 实际项目中这里会从服务器或本地文件加载翻译
      // 这里只是模拟一些简单翻译
      setTimeout(() => {
        if (language === 'en') {
          this.translations.en = {
            'app.name': 'Classroom Assistant',
            'home.title': 'Make your learning more efficient and organized',
            'schedule.title': 'My Schedule',
            'countdown.title': 'Exam Countdown',
            'profile.title': 'My Profile',
            'settings.title': 'Settings',
            // 更多...
          };
        } else {
          this.translations.zh = {
            'app.name': '课堂助手',
            'home.title': '让你的学习生活更高效有序',
            'schedule.title': '我的课表',
            'countdown.title': '考试倒计时',
            'profile.title': '个人资料',
            'settings.title': '设置',
            // 更多...
          };
        }
        resolve();
      }, 100);
    });
  },
  
  /**
   * 切换语言
   * @param {string} language - 语言代码
   * @returns {Promise} 切换完成的Promise
   */
  setLanguage: function(language) {
    if (language === this.currentLanguage) {
      return Promise.resolve();
    }
    
    return this.loadTranslations(language)
      .then(() => {
        this.currentLanguage = language;
        Storage.save('language', language);
        
        // 应用翻译
        this.applyTranslations();
        
        // 触发事件
        window.dispatchEvent(
          new CustomEvent('languageChanged', { detail: { language } })
        );
      });
  },
  
  /**
   * 获取翻译文本
   * @param {string} key - 翻译键
   * @param {Object} params - 用于替换的参数
   * @returns {string} 翻译后的文本
   */
  translate: function(key, params = {}) {
    const translations = this.translations[this.currentLanguage];
    if (!translations || !translations[key]) {
      return key;
    }
    
    let text = translations[key];
    
    // 替换参数
    Object.keys(params).forEach(param => {
      text = text.replace(new RegExp(`{${param}}`, 'g'), params[param]);
    });
    
    return text;
  },
  
  /**
   * 应用翻译到页面
   */
  applyTranslations: function() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.translate(key);
    });
  }
};

