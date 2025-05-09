/**
 * 通知组件 - 负责处理页面中各类通知的显示，包括：
 * 1. 提供不同类型的通知展示（成功、错误、警告、信息）。
 * 2. 管理通知的生命周期（显示、自动关闭、手动关闭）。
 * 3. 限制同时显示的通知数量。
 * 4. 提供支持操作按钮的通知选项。
 * 5. 确保与主题系统的兼容。
 *
 * 主要依赖：
 * - CSS变量系统（用于主题适配）
 * - Font Awesome图标（用于通知类型指示）
 */

// --- 全局作用域变量 ---
// 不需要全局变量

// --- DOM 操作相关函数 ---

/**
 * 自动加载组件样式
 * 检查样式是否已加载，若未加载则动态创建并添加样式链接。
 */
function loadNotificationStyles() {
  // 避免重复加载
  if (document.querySelector('link[href*="notifications.css"]')) {
    return;
  }
  
  // 动态创建 link 元素加载 CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/components/notifications/notifications.css';
  document.head.appendChild(link);
}

/**
 * 初始化通知容器
 * 检查并创建页面中显示通知的容器元素。
 */
function initNotificationContainer() {
  
  // 检查是否已有通知容器
  if (!document.querySelector('.notification-container')) {
    const container = document.createElement('div');
    container.className = 'notification-container';
    document.body.appendChild(container);
  }
}

// --- 工具函数 ---

/**
 * 获取最大通知显示数量
 * 从本地存储中获取配置的最大通知数量，默认为3。
 *
 * @returns {number} 最大显示通知数量
 */
function getMaxNotificationsCount() {
  return parseInt(localStorage.getItem('maxNotifications') || '3', 10);
}

/**
 * 限制通知数量
 * 当通知数量超过最大值时，移除最早的通知。
 */
function limitNotificationsCount() {
  const container = document.querySelector('.notification-container');
  if (!container) return;
  
  const maxCount = getMaxNotificationsCount();
  const notifications = container.querySelectorAll('.notification');
  
  if (notifications.length > maxCount) {
    // 移除最旧的通知（最早添加的）
    for (let i = 0; i < notifications.length - maxCount; i++) {
      notifications[i].classList.add('fade-out');
      setTimeout(() => {
        if (notifications[i].parentElement) {
          notifications[i].remove();
        }
      }, 300);
    }
  }
}

// --- 主要功能函数 ---

/**
 * 显示通知消息
 * 创建并显示一个通知元素，支持不同类型和自定义操作。
 *
 * @param {string} message - 要显示的消息
 * @param {string} type - 消息类型：'success', 'error', 'warning', 'info'
 * @param {number} duration - 显示时长（毫秒）
 * @param {boolean} hasAction - 是否包含操作按钮
 * @param {Object} action - 操作配置 {text: 按钮文本, onClick: 点击回调}
 * @returns {Object} 通知对象，包含close()方法用于手动关闭通知
 */
export function showNotification(message, type = 'info', duration = 3000, hasAction = false, action = null) {
  // 确保有通知容器
  initNotificationContainer();
  
  // 创建通知元素
  const notification = document.createElement('div');
  notification.className = `notification notification-${type} fade-in`;
  
  // 兼容主题系统中使用的类名格式
  notification.classList.add(type);
  
  // 根据类型设置图标
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  // 设置内容
  let notificationContent = `
    <div class="notification-content">
      ${icon}
      <span>${message}</span>
    </div>
  `;
  
  // 如果有操作按钮，添加操作按钮
  if (hasAction && action && action.text) {
    notificationContent += `
      <div class="notification-actions">
        <button class="notification-action">${action.text}</button>
      </div>
    `;
  }
  
  notificationContent += `<button class="notification-close">&times;</button>`;
  
  notification.innerHTML = notificationContent;
  
  // 添加到页面
  const notificationContainer = document.querySelector('.notification-container');
  notificationContainer.appendChild(notification);
  
  // 限制通知数量
  limitNotificationsCount();
  
  // 点击关闭按钮移除通知
  const closeBtn = notification.querySelector('.notification-close');
  closeBtn.addEventListener('click', function() {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  });
  
  // 如果有操作按钮，添加点击事件
  if (hasAction && action && action.onClick) {
    const actionBtn = notification.querySelector('.notification-action');
    if (actionBtn) {
      actionBtn.addEventListener('click', action.onClick);
    }
  }
  
  // 定义关闭方法
  const notificationObj = {
    close: function() {
      if (notification.parentElement) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    },
    element: notification
  };
  
  // 设置自动移除
  if (duration > 0) {
    setTimeout(() => {
      if (notification.parentElement) {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
  
  return notificationObj;
}

/**
 * 显示"功能正在开发中"的通知
 * 便捷方法，用于快速显示功能开发中的提示。
 *
 * @param {string} featureName - 正在开发的功能名称
 * @param {number} duration - 显示时长（毫秒）
 */
export function showDevelopingNotification(featureName = '', duration = 3000) {
  const message = featureName 
    ? `${featureName}功能正在开发中，敬请期待！` 
    : `此功能正在开发中，敬请期待！`;
  
  showNotification(message, 'warning', duration);
}

// --- 兼容性与安全性函数 ---

/**
 * 通知系统与主题系统的兼容适配
 * 确保在各种情况下通知函数都能正常工作。
 */
function ensureNotificationSystem() {
  if (!window.showNotification) {
    window.showNotification = showNotification;
  }
}

// --- 初始化代码 ---
// 在文档加载完成后初始化通知容器
document.addEventListener('DOMContentLoaded', function() {
  // 加载组件样式
  loadNotificationStyles();
  
  // 初始化通知容器
  initNotificationContainer();
  
  // 监听主题变化事件
  window.addEventListener('themeChanged', function(e) {
    // 主题变化时，通知组件本身不需要特殊处理
    // 因为它使用CSS变量，会自动适应主题变化
  });
});

// 为了向后兼容，仍将函数导出到全局
window.showNotification = showNotification;
window.showDevelopingNotification = showDevelopingNotification;

// 确保通知系统在各种情况下都能正常工作
ensureNotificationSystem();

// 添加恢复机制，如果其他脚本覆盖了通知函数，会在5秒后尝试恢复
// TODO: 考虑使用更健壮的方式处理函数覆盖问题
setTimeout(ensureNotificationSystem, 5000);
