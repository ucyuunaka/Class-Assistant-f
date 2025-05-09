// 导入认证检查函数
import { checkFirstLoginExperience } from '/js/auth.js';
// 导入滚动动画组件
import { initScrollAnimation } from "/components/scrollAnimation/scrollAnimation.js";
import { ThemeManager } from "/js/themes.js";

document.addEventListener("DOMContentLoaded", function () {
// 检查首次登录体验
//   checkFirstLoginExperience(); // 调试时临时注释掉
  // 初始化滚动动画
  initScrollAnimation(".animate-on-scroll", {
    threshold: 0.1,
    once: true,
  });

  // 初始化"重置设置"按钮功能
  initResetSettingsButton();
  
  // 简化的主题切换逻辑
  const themeBalls = document.querySelectorAll('.theme-ball');
  const currentThemeText = document.getElementById('current-theme');
  
  // 防止重复初始化
  if (window.themeInitialized) return;
  window.themeInitialized = true;
  
  // 初始化 - 从本地存储加载当前主题
  const savedTheme = localStorage.getItem('theme') || 'classic-blue-pink';
  
  // 应用保存的主题
  document.body.setAttribute('data-theme', savedTheme);
  
  // 更新激活状态和当前主题文本
  updateThemeDisplay(savedTheme);
  
  // 移除现有的点击事件监听器（避免重复监听）
  themeBalls.forEach(ball => {
    const newBall = ball.cloneNode(true);
    ball.parentNode.replaceChild(newBall, ball);
  });
  
  // 重新获取主题球元素
  const refreshedThemeBalls = document.querySelectorAll('.theme-ball');
  
  // 为每个主题球添加点击事件
  refreshedThemeBalls.forEach(ball => {
    ball.addEventListener('click', function() {
      const themeName = this.getAttribute('data-theme');
      
      // 移除所有激活状态
      refreshedThemeBalls.forEach(b => b.classList.remove('active'));
      
      // 添加激活状态到当前选中的主题
      this.classList.add('active');
      
      // 更新当前主题显示
      updateThemeDisplay(themeName);
      
      // 使用ThemeManager设置主题 - 不重复显示通知
      // ThemeManager.setTheme() 会自动显示通知，所以我们这里不再显示
      ThemeManager.setTheme(themeName);
    });
  });

  // 函数：更新主题显示
  function updateThemeDisplay(themeId) {
    const ball = document.querySelector(`.theme-ball[data-theme="${themeId}"]`);
    if (ball) {
      const tooltip = ball.querySelector('.tooltip');
      if (tooltip) {
        const themeTitle = tooltip.innerText.split('\n')[0].trim();
        currentThemeText.innerHTML = `<span class="theme-dot"></span>当前使用：${themeTitle.replace(/[✨🌿🍑🌊💜🔮🌸🌅🌙]/g, '').trim()}`;
      }
    }
  }

  // 字体大小控制
  const decreaseFontBtn = document.getElementById("decrease-font");
  const resetFontBtn = document.getElementById("reset-font");
  const increaseFontBtn = document.getElementById("increase-font");

  // 获取当前字体大小缩放比例
  let fontScale = parseFloat(localStorage.getItem("fontScale") || "1");

  // 应用字体大小
  applyFontSize(fontScale);

  decreaseFontBtn.addEventListener("click", function () {
    if (fontScale > 0.8) {
      fontScale -= 0.1;
      applyFontSize(fontScale);
    }
  });

  resetFontBtn.addEventListener("click", function () {
    fontScale = 1;
    applyFontSize(fontScale);
  });

  increaseFontBtn.addEventListener("click", function () {
    if (fontScale < 1.5) {
      fontScale += 0.1;
      applyFontSize(fontScale);
    }
  });

  // 应用字体大小
  function applyFontSize(scale) {
    document.documentElement.style.fontSize = `${scale}rem`;
    localStorage.setItem("fontScale", scale.toString());
  }

  // 语言切换
  const languageOptions = document.querySelectorAll(".language-option");

  languageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const language = this.getAttribute("data-lang");

      // 移除所有活动类
      languageOptions.forEach((opt) => opt.classList.remove("active"));

      // 添加活动类到当前选择
      this.classList.add("active");

      // 存储语言偏好      
      localStorage.setItem("language", language);

      // 显示切换提示
      window.showNotification(
        `界面语言已切换为${language === "zh" ? "中文" : "English"}`,
        "success"
      );

      // 实际项目中这里会调用翻译函数
      // Translator.setLanguage(language);
    });
  });

  // 初始化确认弹窗
  const confirmModal = document.getElementById("confirm-modal");
  const closeConfirmModal = document.getElementById(
    "close-confirm-modal"
  );
  const cancelAction = document.getElementById("cancel-action");
  const confirmAction = document.getElementById("confirm-action");
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");

  // 关闭确认弹窗
  function closeModal() {
    confirmModal.style.display = "none";
  }

  closeConfirmModal.addEventListener("click", closeModal);
  cancelAction.addEventListener("click", closeModal);

  // 点击外部关闭弹窗
  window.addEventListener("click", function (event) {
    if (event.target === confirmModal) {
      closeModal();
    }
  });

  // 清除数据按钮事件
  document
    .getElementById("clear-all-data")
    .addEventListener("click", function () {
      showConfirmModal(
        "清除所有数据",
        "您确定要清除所有数据吗？此操作将清除课表、考试、个人资料等所有数据，且无法撤销。",
        function () {
          // 保存当前主题和语言设置
          const theme = localStorage.getItem("theme");
          const language = localStorage.getItem("language");

          // 清除所有数据
          localStorage.clear();

          // 恢复主题和语言设置
          if (theme) localStorage.setItem("theme", theme);
          if (language) localStorage.setItem("language", language);

          window.showNotification("所有数据已清除", "success");
        }
      );
    });
    
  // 添加退出登录按钮事件
  document
    .getElementById("logout-btn")
    .addEventListener("click", function () {
      showConfirmModal(
        "退出登录",
        "您确定要退出当前账号吗？",
        function () {
          // 使用登录系统的退出登录功能
          if (window.logoutSystem) {
            window.logoutSystem();
          } else {
            // 如果logoutSystem不可用，执行备用退出逻辑
            localStorage.removeItem("isLoggedIn");
            window.location.href = "/pages/login.html";
          }
        }
      );
    });

  // 显示确认弹窗
  function showConfirmModal(title, message, callback) {
    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    confirmModal.style.display = "flex";

    // 移除之前的事件监听器
    confirmAction.replaceWith(confirmAction.cloneNode(true));

    // 添加新的确认操作
    document
      .getElementById("confirm-action")
      .addEventListener("click", function () {
        callback();
        closeModal();
      });
  }

  // 备份数据
  document
    .getElementById("backup-data")
    .addEventListener("click", function () {
      const backupData = {
        courses: localStorage.getItem("courses"),
        exams: localStorage.getItem("exams"),
        profile: localStorage.getItem("profile"),
        settings: {
          theme: localStorage.getItem("theme"),
          language: localStorage.getItem("language"),
          fontScale: localStorage.getItem("fontScale"),
          notifications: {
            course: document.getElementById("course-notification").checked,
            exam: document.getElementById("exam-notification").checked,
            reminderTime: document.getElementById("reminder-time").value,
            maxCount: document.getElementById("max-notifications").value,
          },
        },
        backupDate: new Date().toISOString(),
      };

      // 创建并下载备份文件
      const blob = new Blob([JSON.stringify(backupData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `class-assistant-backup-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      window.showNotification("数据备份已下载", "success");
    });

  // 恢复数据
  const restoreInput = document.getElementById("restore-input");
  restoreInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
      try {
        const backupData = JSON.parse(event.target.result);

        // 验证备份文件格式
        if (backupData && backupData.backupDate) {
          // 恢复数据
          if (backupData.courses) {
            localStorage.setItem("courses", backupData.courses);
          }
          if (backupData.exams) {
            localStorage.setItem("exams", backupData.exams);
          }
          if (backupData.profile) {
            localStorage.setItem("profile", backupData.profile);
          }

          // 恢复设置
          if (backupData.settings) {
            if (backupData.settings.theme) {
              const restoredTheme = backupData.settings.theme;
              localStorage.setItem("theme", restoredTheme);
              document.body.setAttribute("data-theme", restoredTheme);
              updateThemeDisplay(restoredTheme);
              themeBalls.forEach(ball => {
                ball.classList.toggle("active", ball.getAttribute("data-theme") === restoredTheme);
              });
            }

            if (backupData.settings.language) {
              localStorage.setItem(
                "language",
                backupData.settings.language
              );
              languageOptions.forEach((opt) => {
                opt.classList.toggle(
                  "active",
                  opt.getAttribute("data-lang") ===
                    backupData.settings.language
                );
              });
            }

            if (backupData.settings.fontScale) {
              fontScale = parseFloat(backupData.settings.fontScale);
              applyFontSize(fontScale);
            }

            if (backupData.settings.notifications) {
              document.getElementById("course-notification").checked =
                backupData.settings.notifications.course !== false;
              document.getElementById("exam-notification").checked =
                backupData.settings.notifications.exam !== false;

              if (backupData.settings.notifications.reminderTime) {
                document.getElementById("reminder-time").value =
                  backupData.settings.notifications.reminderTime;
              }
              
              if (backupData.settings.notifications.maxCount) {
                document.getElementById("max-notifications").value =
                  backupData.settings.notifications.maxCount;
              }
            }
          }

          window.showNotification("数据已成功恢复", "success");

          // 重置文件输入
          restoreInput.value = "";
        } else {
          throw new Error("Invalid backup format");
        }
      } catch (e) {
        window.showNotification("无效的备份文件", "error");
      }
    };
    reader.readAsText(file);
  });

  // 检查更新按钮
  document
    .getElementById("check-updates")
    .addEventListener("click", function () {
      window.showNotification("您已经在使用最新版本 (1.0.0)", "success");
    });

  // 处理下拉框焦点状态
  const selectElements = document.querySelectorAll(".form-control");
  
  selectElements.forEach(select => {
    select.addEventListener("focus", function() {
      this.closest(".select-wrapper").classList.add("focus");
    });
    
    select.addEventListener("blur", function() {
      this.closest(".select-wrapper").classList.remove("focus");
    });
  });
  
  // 初始化通知显示数量
  const maxNotificationsSelect = document.getElementById("max-notifications");
  const savedMaxNotifications = localStorage.getItem("maxNotifications") || "3";
  maxNotificationsSelect.value = savedMaxNotifications;
  
  // 保存通知显示数量设置
  maxNotificationsSelect.addEventListener("change", function() {
    const maxCount = this.value;
    localStorage.setItem("maxNotifications", maxCount);
    window.showNotification(`通知显示数量已设为最多${maxCount}条`, "success");
  });
});

/**
 * 初始化重置设置按钮功能
 */
function initResetSettingsButton() {
  // 等待DOM加载完成并确保顶栏已初始化
  setTimeout(() => {
    const resetSettingsBtn = document.querySelector('.reset-settings-btn');
    if (!resetSettingsBtn) {
      console.error('重置设置按钮未找到');
      return;
    }

    resetSettingsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // 使用自定义showConfirmModal函数来显示确认对话框
      showResetSettingsConfirm();
    });
  }, 500); // 给点时间让顶栏组件初始化
}

/**
 * 显示重置设置确认对话框
 */
function showResetSettingsConfirm() {
  // 获取确认弹窗元素
  const confirmModal = document.getElementById("confirm-modal");
  if (!confirmModal) {
    console.error('确认弹窗元素未找到');
    return;
  }
  
  // 获取弹窗内的元素
  const confirmTitle = document.getElementById("confirm-title");
  const confirmMessage = document.getElementById("confirm-message");
  const confirmAction = document.getElementById("confirm-action");
  const cancelAction = document.getElementById("cancel-action");
  const closeBtn = document.getElementById("close-confirm-modal");
  
  // 设置弹窗内容
  confirmTitle.textContent = "重置所有设置";
  confirmMessage.textContent = "您确定要将所有设置恢复为默认值吗？此操作不会影响您的课表和考试数据。";
  
  // 确保弹窗可见
  confirmModal.style.display = "flex";
  confirmModal.style.zIndex = "10000"; // 确保在最上层
  
  // 清除之前的点击事件处理函数
  const handleModalClick = function(e) {
    if (e.target === confirmModal) {
      confirmModal.style.display = "none";
      confirmModal.removeEventListener("click", handleModalClick);
    }
  };
  
  // 移除之前可能存在的事件监听器
  confirmModal.removeEventListener("click", handleModalClick);
  
  // 移除确认按钮已有的事件监听器并添加新的
  const newConfirmBtn = confirmAction.cloneNode(true);
  confirmAction.parentNode.replaceChild(newConfirmBtn, confirmAction);
  
  const newCancelBtn = cancelAction.cloneNode(true);
  cancelAction.parentNode.replaceChild(newCancelBtn, cancelAction);
  
  const newCloseBtn = closeBtn.cloneNode(true);
  closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
  
  // 重新获取按钮元素
  const updatedConfirmBtn = document.getElementById("confirm-action");
  const updatedCancelBtn = document.getElementById("cancel-action");
  const updatedCloseBtn = document.getElementById("close-confirm-modal");
  
  // 添加新的事件监听器
  updatedConfirmBtn.addEventListener("click", function() {
    resetAllSettings();
    confirmModal.style.display = "none";
  });
  
  updatedCancelBtn.addEventListener("click", function() {
    confirmModal.style.display = "none";
  });
  
  updatedCloseBtn.addEventListener("click", function() {
    confirmModal.style.display = "none";
  });
  
  // 添加点击背景关闭弹窗的事件
  confirmModal.addEventListener("click", handleModalClick);
}

/**
 * 重置所有设置为默认值
 */
function resetAllSettings() {
  // 1. 重置主题为默认主题
  const defaultTheme = 'classic-blue-pink';
  localStorage.setItem('theme', defaultTheme);
  document.body.setAttribute('data-theme', defaultTheme);
  
  // 更新主题球显示
  const themeBalls = document.querySelectorAll('.theme-ball');
  themeBalls.forEach(ball => {
    ball.classList.toggle("active", ball.getAttribute("data-theme") === defaultTheme);
  });
  
  // 更新当前主题文本
  const currentThemeText = document.getElementById('current-theme');
  if (currentThemeText) {
    currentThemeText.innerHTML = `<span class="theme-dot"></span>当前使用：经典蓝粉`;
  }
  
  // 2. 重置字体大小
  const defaultFontScale = 1;
  localStorage.setItem('fontScale', defaultFontScale.toString());
  document.documentElement.style.fontSize = `${defaultFontScale}rem`;
  
  // 3. 重置语言为中文
  const defaultLanguage = 'zh';
  localStorage.setItem('language', defaultLanguage);
  const languageOptions = document.querySelectorAll('.language-option');
  languageOptions.forEach(option => {
    option.classList.toggle('active', option.getAttribute('data-lang') === defaultLanguage);
  });
  
  // 4. 重置通知设置
  document.getElementById('course-notification').checked = true;
  document.getElementById('exam-notification').checked = true;
  document.getElementById('reminder-time').value = '30';
  document.getElementById('max-notifications').value = '3';
  localStorage.setItem('maxNotifications', '3');
  
  // 显示成功消息
  window.showNotification('所有设置已恢复为默认值', 'success');
}

// --- Component Initialization (Moved from settings.html) ---
import { Sidebar } from "/components/sidebar/sidebar.js";
import { Header } from "/components/header/header.js";

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = new Sidebar("sidebar-container");

  // 初始化顶栏组件
  const header = new Header("header-container", {
    title: "设置", // 保留标题
    // subtitle: "自定义你的应用体验和偏好", // 移除副标题
    // buttons: [ ... ], // 移除按钮数组，根据计划此页面Header不需要按钮
    // buttonPosition: "right", // 移除 buttonPosition
  });

  // Note: The 'reset-settings-btn' functionality is handled elsewhere in this script.
});
// --- End Component Initialization ---
