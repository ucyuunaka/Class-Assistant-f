/**
 * 该脚本定义了一个统一的 Header 组件，用于在页面顶部显示标题、可选副标题和可选按钮组。
 * 主要功能包括：
 * 1. 统一的 HTML 结构和布局（左侧标题/副标题，右侧按钮）。
 * 2. 提供可配置的标题（必选）、副标题（可选）和按钮组（可选，0-2个）。
 * 3. 按钮样式统一，固定在右侧。
 * 4. 支持自定义背景样式。
 *
 * 主要依赖：
 * - 动态加载 header.css 样式
 */

// --- 类定义 ---
export class Header {
  /**
   * 初始化统一的顶栏组件
   *
   * @param {string} containerId - 顶栏容器的ID
   * @param {Object} options - 配置选项
   * @param {string} options.title - 标题文本 (必选)
   * @param {string} [options.subtitle] - 副标题文本 (可选)
   * @param {Array} [options.buttons=[]] - 按钮配置数组 [{text: '按钮文本', url: '链接地址', id: '可选ID', className: '可选自定义类'}] (可选, 最多2个)
   * @param {string} [options.backgroundClass=''] - 背景样式类，可自定义顶栏的背景样式 (可选)
   */
  constructor(containerId, options = {}) {
    // 加载样式
    this.loadStyles();
    
    // 获取容器元素
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Header组件初始化失败：找不到ID为 ${containerId} 的容器元素`);
      return;
    }
    
    // 设置默认选项
    this.options = Object.assign({
      title: '页面标题', // 标题是必需的，提供一个默认值
      subtitle: null,    // 副标题默认为null
      buttons: [],       // 按钮默认为空数组
      backgroundClass: '' // 背景类默认为空
    }, options);

    // 验证标题是否存在
    if (!this.options.title) {
      console.error('Header组件初始化失败：必须提供 title 选项');
      return;
    }
    
    // 渲染顶栏
    this.render();
  }
  
  /**
   * 加载组件样式
   * 创建并添加link元素引用header.css到文档头部
   * 避免重复添加样式表
   */
  loadStyles() {
    if (!document.getElementById('header-component-styles')) {
      const link = document.createElement('link');
      link.id = 'header-component-styles';
      link.rel = 'stylesheet';
      
      // 使用绝对路径
      link.href = '/components/header/header.css';
      
      document.head.appendChild(link);
    }
  }
  
  /**
   * 渲染统一的顶栏内容
   */
  render() {
    this.renderUnifiedHeader();
  }

  /**
   * 渲染统一布局的顶栏
   * 创建包含标题、可选副标题和可选右侧按钮的头部
   */
  renderUnifiedHeader() {
    // 添加自定义背景样式类
    const backgroundClass = this.options.backgroundClass ? ` ${this.options.backgroundClass}` : '';

    // 生成副标题 HTML (如果提供了 subtitle)
    const subtitleHtml = this.options.subtitle
      ? `<p class="header-subtitle">${this.options.subtitle}</p>`
      : '';

    const html = `
      <section class="header-component unified-header${backgroundClass}">
        <div class="container">
          <div class="header-content">
            <h1 class="header-title">${this.options.title}</h1>
            ${subtitleHtml}
          </div>
          ${this.renderButtons()}
        </div>
      </section>
    `;
    
    this.container.innerHTML = html;
  }
  
  /**
   * 渲染按钮组 (固定在右侧)
   * 根据配置生成按钮HTML，所有按钮使用统一样式
   *
   * @returns {string} 按钮HTML
   */
  renderButtons() {
    // 检查按钮数组是否存在且不为空，并且数量不超过2个
    if (!this.options.buttons || !Array.isArray(this.options.buttons) || this.options.buttons.length === 0) {
      return ''; // 没有按钮或按钮配置无效，返回空字符串
    }

    // 限制按钮数量最多为 2 个
    const buttonsToRender = this.options.buttons.slice(0, 2);

    const buttonsHtml = buttonsToRender.map(button => {
      // 基础按钮样式类 (将在 CSS 中定义)
      let btnClass = 'header-btn';
      
      // 添加可选的自定义类
      if (button.className) {
        btnClass += ` ${button.className}`;
      }

      // 添加可选的 ID
      const buttonId = button.id ? ` id="${button.id}"` : '';
      
      // 优先使用 button.url，如果不存在则使用 '#'
      const buttonUrl = button.url || '#';

      return `<a href="${buttonUrl}" class="${btnClass}"${buttonId}>${button.text}</a>`;
    }).join('');
    
    // 统一的按钮容器类
    const containerClass = 'header-buttons';
    
    return `<div class="${containerClass}">${buttonsHtml}</div>`;
  }
}
