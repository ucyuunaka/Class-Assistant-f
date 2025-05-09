/**
 * 该脚本主要负责侧边栏导航组件的功能实现，包括：
 * 1. 动态加载侧边栏HTML内容。
 * 2. 处理侧边栏的交互效果（展开/收缩）。
 * 3. 处理响应式布局下的侧边栏显示/隐藏。
 * 4. 高亮当前页面对应的菜单项。
 *
 * 主要依赖的 DOM 元素:
 * - 由containerId指定的侧边栏容器元素。
 * - .sidebar-item: 侧边栏菜单项。
 * - .sidebar-overlay: 移动端遮罩层。
 */

// 检查并加载用户头像
function loadGlobalUserAvatar() {
  // 延迟执行以确保DOM已完全加载
  setTimeout(() => {
    const sidebarAvatars = document.querySelectorAll('.sidebar-profile-img img');
    if (sidebarAvatars.length > 0) {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        sidebarAvatars.forEach(avatar => {
          avatar.src = savedAvatar;
        });
      }
    }
  }, 300);
}

// 在页面加载时立即执行
document.addEventListener('DOMContentLoaded', loadGlobalUserAvatar);

// --- 导出侧边栏类 ---
export class Sidebar {
  /**
   * 侧边栏组件构造函数
   * @param {string} containerId - 侧边栏容器的DOM ID
   */
  constructor(containerId) {
    this.containerId = containerId;
    this.container = document.getElementById(containerId);
    this.init();
  }

  // --- 初始化方法 ---

  /**
   * 初始化侧边栏组件
   * 检查容器是否存在，加载样式和内容
   */
  init() {
    if (!this.container) {
      console.error('未找到侧边栏容器元素:', this.containerId);
      return;
    }

    // 添加侧边栏样式
    this.loadStyles();
    
    // 加载侧边栏HTML内容
    this.loadSidebarContent();
    
    // 检测是否为触摸设备
    this.isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    // 在触摸设备上添加额外处理
    if (this.isTouchDevice) {
      this.setupTouchHandlers();
    }
    
    // 添加头像更新事件监听
    this.listenForAvatarUpdates();
  }
  
  /**
   * 加载侧边栏样式
   * 检查是否已加载样式表，若未加载则创建并添加link元素
   */  
  loadStyles() {
    // 检查是否已经加载了样式
    if (!document.querySelector('link[href*="sidebar.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      
      // 使用绝对路径
      link.href = '/components/sidebar/sidebar.css';
      document.head.appendChild(link);
    }
  }

  /**
   * 加载侧边栏HTML内容
   * 通过fetch加载HTML模板并插入到容器中
   */  
  loadSidebarContent() {
    // 添加sidebar类
    this.container.classList.add('sidebar');
    
    // 创建侧边栏悬停遮罩层元素
    this.createOverlay();
    
    // 使用绝对路径
    const htmlPath = '/components/sidebar/sidebar.html';
    
    // 加载开始提示
    
    // 加载侧边栏内容
    fetch(htmlPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('无法加载侧边栏模板');
        }
        return response.text();
      })
      .then(html => {
        // 插入侧边栏内容
        this.container.innerHTML = html;
        
        // 初始化侧边栏功能
        this.initSidebar();
        
        // 监听主题变化事件
        this.listenForThemeChanges();
        
        // 初始化侧边栏悬停功能
        this.initSidebarHover();
        
        // 加载用户头像
        this.loadUserAvatar();
      })
      .catch(error => {
        console.error('侧边栏加载失败:', error);
        this.container.innerHTML = '<p style="color: red; padding: 1rem;">错误：无法加载侧边栏内容。</p>';
      });
  }

  /**
   * 创建侧边栏遮罩层
   * 当侧边栏悬停时显示的半透明遮罩层
   */
  createOverlay() {
    // 检查是否已存在遮罩层
    if (!document.querySelector('.sidebar-hover-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-hover-overlay';
      document.body.appendChild(overlay);
      this.overlay = overlay;
    } else {
      this.overlay = document.querySelector('.sidebar-hover-overlay');
    }
  }

  // --- 事件与交互处理 ---

  /**
   * 初始化侧边栏功能
   * 设置当前页面高亮、菜单项点击事件和移动端响应
   */
  initSidebar() {
    // 获取当前页面路径，用于高亮当前页对应的菜单项
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop();
    
    // 初始化菜单项高亮
    this.highlightCurrentMenuItem(pageName);
    
    // 使用事件委托为菜单项添加点击事件，提高在小屏幕下的点击可靠性
    this.container.addEventListener('click', (event) => {
      // 查找最近的菜单项父元素
      const menuItem = event.target.closest('.sidebar-item');
      if (menuItem) {
        // 获取链接地址
        const link = menuItem.getAttribute('data-href');
        if (link) {
          // 在小屏幕模式下点击菜单项后自动关闭侧边栏
          if (window.innerWidth <= 768) {
            this.toggleSidebar(false);
            
            // 允许关闭动画完成后再导航
            setTimeout(() => {
              // 使用绝对路径
              let targetUrl = link;
              
              // 如果链接不是以/开头，添加/
              if (!targetUrl.startsWith('/')) {
                targetUrl = '/' + targetUrl;
              }
              
              // 页面跳转
              window.location.href = targetUrl;
            }, 300); // 延迟与CSS过渡时间一致
          } else {
            // 桌面模式下直接导航
            let targetUrl = link;
            
            // 如果链接不是以/开头，添加/
            if (!targetUrl.startsWith('/')) {
              targetUrl = '/' + targetUrl;
            }
            
            // 页面跳转
            window.location.href = targetUrl;
          }
        }
      }
    });

    // 移动端侧边栏切换
    this.setupMobileToggle();
    
    // 窗口大小改变时处理
    window.addEventListener('resize', () => {
      // 在移动端和桌面端之间切换时调整侧边栏状态
      if (window.innerWidth > 768) {
        this.toggleSidebar(false);
        this.container.style.pointerEvents = 'auto'; // 恢复正常事件处理
      } else {
        // 确保小屏幕下非激活状态时，宽度为0
        if (!this.container.classList.contains('active')) {
          this.container.style.pointerEvents = 'none'; // 防止遮挡内容的点击
        } else {
          this.container.style.pointerEvents = 'auto'; // 激活状态下允许点击
        }
      }
    });
    
    // 初始化时根据屏幕宽度设置正确的交互模式
    if (window.innerWidth <= 768) {
      this.container.style.pointerEvents = 'none';
    }
  }

  /**
   * 设置移动端切换功能
   * 创建移动端切换按钮和遮罩层，添加相应的事件监听
   */
  setupMobileToggle() {
    // 如果移动端切换按钮不存在，则创建一个
    if (!document.querySelector('.sidebar-toggle')) {
      const toggle = document.createElement('div');
      toggle.className = 'sidebar-toggle';
      toggle.innerHTML = '<i class="ri-menu-line"></i>';
      document.body.appendChild(toggle);
      
      toggle.addEventListener('click', () => {
        this.toggleSidebar(null);
      });
    }

    // 如果移动端遮罩层不存在，则创建一个
    if (!document.querySelector('.sidebar-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      document.body.appendChild(overlay);
      
      overlay.addEventListener('click', () => {
        this.toggleSidebar(false);
      });
      
      // 确保在触摸设备上也能正常工作
      overlay.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.toggleSidebar(false);
      });
    }
  }

  /**
   * 初始化侧边栏悬停效果
   * 添加鼠标进入/离开事件，控制遮罩层的显示/隐藏
   */
  initSidebarHover() {
    if (this.container && this.overlay) {
      this.container.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) {
          // 显示遮罩层
          this.overlay.classList.add('active');
        }
      });

      this.container.addEventListener('mouseleave', () => {
        if (window.innerWidth > 768) {
          // 隐藏遮罩层
          this.overlay.classList.remove('active');
        }
      });

      // 确保遮罩层不会拦截点击事件
      this.overlay.addEventListener('mouseenter', () => {
        if (window.innerWidth > 768) {
          this.overlay.classList.remove('active');
        }
      });
    }
  }

  /**
   * 监听主题变化事件
   * 响应主题变化自定义事件，使侧边栏适应主题样式
   */
  listenForThemeChanges() {
    // 监听主题变化自定义事件
    window.addEventListener('themeChanged', (e) => {
      // 侧边栏不需要特殊处理，因为我们使用了 [data-theme="dark"] 选择器
      // CSS 会自动应用相应的样式
    });
  }

  /**
   * 高亮当前页面对应的菜单项
   * @param {string} pageName - 当前页面文件名
   */
  highlightCurrentMenuItem(pageName) {
    // 默认高亮首页
    let itemToHighlight = 'index.html';
    
    // 如果有特定的页面名
    if (pageName && pageName !== '') {
      itemToHighlight = pageName;
    }
    
    // 寻找并高亮对应的菜单项
    const menuItems = document.querySelectorAll('.sidebar-item');
    menuItems.forEach(item => {
      const itemLink = item.getAttribute('data-href');
      
      // 移除所有高亮
      item.classList.remove('active');
      
      // 如果匹配当前页面，添加高亮
      if (itemLink && itemLink.includes(itemToHighlight)) {
        item.classList.add('active');
      }
    });
  }

  /**
   * 切换侧边栏显示/隐藏
   * @param {boolean|null} show - 是否显示，null表示切换状态
   */
  toggleSidebar(show = null) {
    const overlay = document.querySelector('.sidebar-overlay');
    const toggleButton = document.querySelector('.sidebar-toggle'); // 获取切换按钮
    
    // 确定最终状态
    const shouldShow = show === null ? !this.container.classList.contains('active') : show;
    
    // 更新侧边栏和遮罩层状态
    if (shouldShow) {
      this.container.classList.add('active');
      if (toggleButton) toggleButton.classList.add('hidden'); // 隐藏切换按钮
      // 确保小屏幕下侧边栏有足够宽度以激活点击区域
      if (window.innerWidth <= 768) {
        this.container.style.pointerEvents = 'auto'; // 确保事件可以被捕获
      }
      if (overlay) overlay.classList.add('active');
    } else {
      this.container.classList.remove('active');
      if (overlay) overlay.classList.remove('active');
      if (toggleButton) toggleButton.classList.remove('hidden'); // 显示切换按钮
    }
  }

  /**
   * 为触摸设备设置特定处理
   */
  setupTouchHandlers() {
    // 防止iOS Safari上的橡皮筋效果
    document.body.addEventListener('touchmove', (e) => {
      if (this.container.classList.contains('active') && !this.container.contains(e.target)) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // 监听触摸事件，优化菜单项的点击体验
    this.container.addEventListener('touchstart', (e) => {
      const menuItem = e.target.closest('.sidebar-item');
      if (menuItem) {
        menuItem.classList.add('touch-active');
      }
    }, { passive: true });
    
    this.container.addEventListener('touchend', (e) => {
      const activeItems = this.container.querySelectorAll('.touch-active');
      activeItems.forEach(item => item.classList.remove('touch-active'));
    }, { passive: true });
    
    // 取消移动端上的点击延迟
    if ('touchAction' in document.body.style) {
      this.container.style.touchAction = 'manipulation';
    }
  }

  /**
   * 加载用户头像
   * 从localStorage获取头像并更新到侧边栏
   */
  loadUserAvatar() {
    const avatarImg = this.container.querySelector('.sidebar-profile-img img');
    if (avatarImg) {
      const savedAvatar = localStorage.getItem('userAvatar');
      if (savedAvatar) {
        avatarImg.src = savedAvatar;
      }
    }
  }
  
  /**
   * 监听头像更新事件
   * 当用户在个人资料页更新头像时，同步更新侧边栏头像
   */
  listenForAvatarUpdates() {
    document.addEventListener('user-avatar-updated', (event) => {
      const avatarImg = this.container.querySelector('.sidebar-profile-img img');
      if (avatarImg && event.detail && event.detail.avatarSrc) {
        avatarImg.src = event.detail.avatarSrc;
      }
    });
  }
}
