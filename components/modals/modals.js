/**
 * 该脚本定义并导出模态弹窗组件，提供多种类型模态窗口的创建和管理功能，包括：
 * 1. 创建和显示多种类型的模态弹窗（基础、确认、警告、危险、成功、错误）
 * 2. 提供弹窗按钮、大小和位置的自定义选项
 * 3. 管理模态弹窗的显示和关闭过程，包括动画效果
 * 4. 处理已存在于DOM中的模态窗口的显示和隐藏
 *
 * 主要依赖的DOM元素：
 * - 动态创建的模态弹窗容器和内容元素
 * - 关闭按钮和操作按钮
 */

// --- 全局模态窗口对象定义 ---
const Modal = {
  // 存储当前打开的模态弹窗ID
  activeModal: null,
  
  /**
   * 创建并显示基本模态弹窗
   * 
   * @param {Object} options - 配置选项
   * @param {string} options.title - 弹窗标题
   * @param {string} options.content - 弹窗内容（HTML字符串）
   * @param {string} options.type - 弹窗类型（'', 'info', 'success', 'warning', 'danger'）
   * @param {string} options.size - 弹窗大小（'', 'sm', 'lg', 'xl', 'fullscreen'）
   * @param {Array} options.buttons - 按钮配置数组
   * @param {boolean} options.closeOnBackdrop - 点击背景是否关闭弹窗
   * @param {Function} options.onOpen - 弹窗打开后的回调
   * @param {Function} options.onClose - 弹窗关闭后的回调
   * @param {string} options.footerAlign - 底部按钮对齐方式（'', 'centered', 'spaced', 'left', 'stacked'）
   * @returns {string} 创建的模态弹窗ID
   */
  show: function(options) {
    
    // 基本配置
    const config = Object.assign({
      title: '提示',
      content: '',
      type: '',  // '', 'info', 'success', 'warning', 'danger'
      size: '',  // '', 'sm', 'lg', 'xl', 'fullscreen'
      buttons: [
        {
          text: '确定',
          type: 'primary',
          onClick: () => this.close()
        }
      ],
      closeOnBackdrop: true,
      onOpen: null,
      onClose: null,
      footerAlign: ''  // '', 'centered', 'spaced', 'left', 'stacked'
    }, options);
    
    // 创建模态弹窗容器
    const modalId = 'modal-' + Date.now();
    const modalEl = document.createElement('div');
    modalEl.id = modalId;
    modalEl.className = `modal-container ${config.size ? 'modal-' + config.size : ''} ${config.type ? 'modal-' + config.type : ''}`;
    
    // 创建模态弹窗内容HTML
    let modalHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">${config.title}</h3>
          <button class="modal-close" data-action="close">&times;</button>
        </div>
        <div class="modal-body">
          ${config.content}
        </div>
        <div class="modal-footer ${config.footerAlign}">`;
    
    // 添加按钮
    config.buttons.forEach(btn => {
      const btnClass = btn.type ? `modal-btn modal-btn-${btn.type}` : 'modal-btn modal-btn-secondary';
      modalHTML += `<button class="${btnClass}" data-action="${btn.action || ''}">${btn.text}</button>`;
    });
    
    modalHTML += `
        </div>
      </div>
    `;
    
    modalEl.innerHTML = modalHTML;
    document.body.appendChild(modalEl);
    
    // 绑定按钮事件
    const buttons = modalEl.querySelectorAll('.modal-footer button');
    buttons.forEach((button, index) => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        if (config.buttons[index].onClick) {
          config.buttons[index].onClick(e);
        }
      });
    });
    
    // 绑定关闭按钮事件
    const closeBtn = modalEl.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.close();
      });
    }
    
    // 绑定背景点击关闭事件
    if (config.closeOnBackdrop) {
      modalEl.addEventListener('click', (e) => {
        if (e.target === modalEl) {
          this.close();
        }
      });
    }
    
    // 存储回调函数
    this._onClose = config.onClose;
    
    // 存储当前模态弹窗引用
    this.activeModal = {
      id: modalId,
      element: modalEl
    };
    
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';

    // 延迟一帧添加active类，确保过渡动画正常
    requestAnimationFrame(() => {
      modalEl.classList.add('active');
    });
    
    // 调用打开回调
    if (config.onOpen) {
      config.onOpen();
    }
    
    // 绑定ESC关闭
    document.addEventListener('keydown', this._handleEscKey);
    
    return modalId;
  },
  
  /**
   * 关闭当前模态弹窗
   * 移除DOM元素并恢复页面滚动功能
   */
  close: function() {
    if (!this.activeModal) return;
    
    const modalEl = this.activeModal.element;
    const modalId = this.activeModal.id;
    
    // 移除active类
    modalEl.classList.remove('active');
    
    // 解绑ESC关闭
    document.removeEventListener('keydown', this._handleEscKey);
    
    // 等待过渡动画完成后移除元素
    setTimeout(() => {
      modalEl.remove();
      document.body.style.overflow = '';
      
      
      // 调用关闭回调
      if (this._onClose) {
        this._onClose();
      }
      
      this.activeModal = null;
      this._onClose = null;
    }, 300); // 与CSS过渡时间匹配
  },
  
  /**
   * 处理ESC键关闭事件
   * 
   * @param {KeyboardEvent} e - 键盘事件对象
   */
  _handleEscKey: function(e) {
    if (e.key === 'Escape' && window.Modal.activeModal) {
      window.Modal.close();
    }
  },
  
  /**
   * 显示已存在于DOM中的模态窗口
   * 
   * @param {HTMLElement} modalElement - 已存在的模态窗口DOM元素
   * @param {Object} options - 配置选项
   * @param {Function} options.onOpen - 弹窗打开后的回调
   * @param {Function} options.onClose - 弹窗关闭后的回调
   * @param {boolean} options.closeOnBackdrop - 点击背景是否关闭弹窗
   * @returns {string} 模态弹窗ID
   */
  showExisting: function(modalElement, options = {}) {
    
    if (!modalElement) {
      console.error('错误: 未提供有效的模态窗口元素');
      return;
    }
    
    // 基本配置
    const config = Object.assign({
      onOpen: null,
      onClose: null,
      closeOnBackdrop: true
    }, options);
    
    // 存储当前模态弹窗引用
    const modalId = modalElement.id || 'existing-modal-' + Date.now();
    
    // 如果已经有激活的模态窗口，先关闭它
    if (this.activeModal) {
      this.close();
    }
    
    this.activeModal = {
      id: modalId,
      element: modalElement,
      isExisting: true
    };
    
    // 显示模态窗口
    modalElement.style.display = 'flex';
    
    // 确保模态窗口内容可见
    const contentElement = modalElement.querySelector('.modal-content');
    if (contentElement) {
      contentElement.style.opacity = '1';
      contentElement.style.transform = 'scale(1)';
      contentElement.style.zIndex = '10000';
    }
    
    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
    
    // 绑定关闭事件
    const closeBtn = modalElement.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideExisting(modalElement));
    }
    
    // 绑定背景点击关闭事件
    if (config.closeOnBackdrop) {
      const handleBackdropClick = (e) => {
        if (e.target === modalElement) {
          this.hideExisting(modalElement);
        }
      };
      modalElement.addEventListener('click', handleBackdropClick);
      // 存储事件处理函数以便后续移除
      this._backdropClickHandler = handleBackdropClick;
    }
    
    // 绑定ESC关闭
    document.addEventListener('keydown', this._handleEscKey);
    
    // 调用打开回调
    if (config.onOpen) {
      config.onOpen();
    }
    
    // 存储关闭回调
    this._onExistingClose = config.onClose;
    
    
    return modalId;
  },
  
  /**
   * 隐藏已存在于DOM中的模态窗口
   * 
   * @param {HTMLElement} modalElement - 要隐藏的模态窗口DOM元素
   */
  hideExisting: function(modalElement) {
    
    if (!modalElement) {
      console.error('错误: 未提供有效的模态窗口元素');
      return;
    }
    
    // 隐藏模态窗口
    modalElement.style.display = 'none';
    
    // 重置模态窗口内容样式
    const contentElement = modalElement.querySelector('.modal-content');
    if (contentElement) {
      // 重置内容元素样式，准备下次显示
      contentElement.style.opacity = '';
      contentElement.style.transform = '';
      contentElement.style.zIndex = '';
    }
    
    // 恢复背景滚动
    document.body.style.overflow = '';
    
    // 解绑ESC关闭
    document.removeEventListener('keydown', this._handleEscKey);
    
    // 如果存在背景点击事件，移除它
    if (this._backdropClickHandler) {
      modalElement.removeEventListener('click', this._backdropClickHandler);
      this._backdropClickHandler = null;
    }
    
    // 调用关闭回调
    if (this._onExistingClose) {
      this._onExistingClose();
      this._onExistingClose = null;
    }
    
    // 重置当前模态窗口引用
    if (this.activeModal && this.activeModal.isExisting) {
      this.activeModal = null;
    }
    
  }
};

// --- 导出函数 ---

/**
 * 显示基本模态弹窗
 * 
 * @param {string} title - 弹窗标题
 * @param {string} content - 弹窗内容
 * @param {Array} buttons - 自定义按钮配置数组
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showModal(title, content, buttons, options = {}) {
  const modalOptions = {
    title,
    content,
    ...options // 先合并其他选项
  };
  // 只有当 buttons 参数被提供时，才覆盖默认按钮
  if (buttons) {
    modalOptions.buttons = buttons;
  }
  // 否则，Modal.show 会使用其内部的默认按钮
  return Modal.show(modalOptions);
}

/**
 * 显示确认模态弹窗，包含确认和取消按钮
 * 
 * @param {string} title - 弹窗标题
 * @param {string} message - 确认消息内容
 * @param {Function} confirmCallback - 点击确认按钮的回调函数
 * @param {Function} cancelCallback - 点击取消按钮的回调函数
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showConfirmModal(title, message, confirmCallback, cancelCallback, options = {}) {
  const buttons = [
    {
      text: options.cancelText || '取消',
      type: 'secondary',
      onClick: () => {
        Modal.close();
        if (cancelCallback) cancelCallback();
      }
    },
    {
      text: options.confirmText || '确认',
      type: options.confirmType || 'primary',
      onClick: () => {
        Modal.close();
        if (confirmCallback) confirmCallback();
      }
    }
  ];
  
  return Modal.show({
    title,
    content: message,
    buttons,
    type: options.type || '',
    ...options
  });
}

/**
 * 显示警告确认模态弹窗，带警告颜色
 * 
 * @param {string} title - 弹窗标题
 * @param {string} message - 警告消息内容
 * @param {Function} confirmCallback - 点击确认按钮的回调函数
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showWarningModal(title, message, confirmCallback, options = {}) {
  return showConfirmModal(
    title,
    message,
    confirmCallback,
    null,
    {
      type: 'warning',
      confirmType: 'warning',
      confirmText: options.confirmText || '继续',
      ...options
    }
  );
}

/**
 * 显示危险操作确认模态弹窗，带危险颜色
 * 
 * @param {string} title - 弹窗标题
 * @param {string} message - 危险操作消息内容
 * @param {Function} confirmCallback - 点击确认按钮的回调函数
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showDangerModal(title, message, confirmCallback, options = {}) {
  return showConfirmModal(
    title,
    message,
    confirmCallback,
    null,
    {
      type: 'danger',
      confirmType: 'danger',
      confirmText: options.confirmText || '删除',
      ...options
    }
  );
}

/**
 * 显示成功模态弹窗，带成功图标
 * 
 * @param {string} title - 弹窗标题
 * @param {string} message - 成功消息内容
 * @param {Function} callback - 点击按钮的回调函数
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showSuccessModal(title, message, callback, options = {}) {
  // 创建带有图标的成功弹窗
  const content = `
    <div class="modal-icon">
      <i class="fas fa-check-circle"></i>
    </div>
    <div class="modal-body text-center">${message}</div>
  `;
  
  return Modal.show({
    title,
    content,
    type: 'success',
    footerAlign: 'centered',
    buttons: [
      {
        text: options.buttonText || '确定',
        type: 'success',
        onClick: () => {
          Modal.close();
          if (callback) callback();
        }
      }
    ],
    ...options
  });
}

/**
 * 显示错误模态弹窗，带错误图标
 * 
 * @param {string} title - 弹窗标题
 * @param {string} message - 错误消息内容
 * @param {Function} callback - 点击按钮的回调函数
 * @param {Object} options - 其他配置选项
 * @returns {string} 创建的模态弹窗ID
 */
export function showErrorModal(title, message, callback, options = {}) {
  // 创建带有图标的错误弹窗
  const content = `
    <div class="modal-icon">
      <i class="fas fa-exclamation-circle"></i>
    </div>
    <div class="modal-body text-center">${message}</div>
  `;
  
  return Modal.show({
    title,
    content,
    type: 'danger',
    footerAlign: 'centered',
    buttons: [
      {
        text: options.buttonText || '确定',
        type: 'danger',
        onClick: () => {
          Modal.close();
          if (callback) callback();
        }
      }
    ],
    ...options
  });
}

// --- 导出和全局化 ---

// 导出Modal对象
export { Modal };

// 向后兼容: 添加到全局对象
window.Modal = Modal;
window.showModal = showModal;
window.showConfirmModal = showConfirmModal;
window.showWarningModal = showWarningModal;
window.showDangerModal = showDangerModal;
window.showSuccessModal = showSuccessModal;
window.showErrorModal = showErrorModal;
