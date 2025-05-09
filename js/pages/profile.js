import { checkFirstLoginExperience } from '/js/auth.js';
import { initScrollAnimation } from "/components/scrollAnimation/scrollAnimation.js";
import { showConfirmModal } from "/components/modals/modals.js";

document.addEventListener("DOMContentLoaded", function () {
// 检查首次登录体验
//   checkFirstLoginExperience(); // 调试时临时注释掉
  // 初始化滚动动画
  initScrollAnimation(".animate-on-scroll", {
    threshold: 0.1,
    once: true,
  });

  // 创建自定义弹窗函数
  function createCustomConfirmDialog(title, imgSrc, message, confirmCallback, cancelCallback) {
    // 创建弹窗背景层
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0,0,0,0.5)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '9999';
    
    // 创建弹窗主体
    const dialog = document.createElement('div');
    dialog.style.backgroundColor = 'var(--background-color, white)';
    dialog.style.borderRadius = 'var(--border-radius, 8px)';
    dialog.style.boxShadow = 'var(--shadow, 0 4px 12px rgba(0,0,0,0.15))';
    dialog.style.width = '300px';
    dialog.style.maxWidth = '95%';
    dialog.style.padding = '20px';
    dialog.style.textAlign = 'center';
    
    // 创建标题
    const titleElem = document.createElement('h3');
    titleElem.textContent = title;
    titleElem.style.marginTop = '0';
    titleElem.style.marginBottom = '15px';
    
    // 创建图片预览
    const img = document.createElement('img');
    img.src = imgSrc;
    img.style.width = '150px';
    img.style.height = '150px';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    img.style.border = '3px solid var(--primary-color, #0078d4)';
    img.style.marginBottom = '15px';
    
    // 创建消息文本
    const messageElem = document.createElement('p');
    messageElem.textContent = message;
    messageElem.style.marginBottom = '20px';
    
    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.display = 'flex';
    buttonContainer.style.justifyContent = 'center';
    buttonContainer.style.gap = '10px';
    
    // 创建确认按钮
    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '使用此头像';
    confirmBtn.className = 'btn';
    confirmBtn.onclick = function() {
      document.body.removeChild(overlay);
      confirmCallback && confirmCallback();
    };
    
    // 创建取消按钮
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'btn btn-outline'; // 使用现有的按钮样式
    cancelBtn.onclick = function() {
      document.body.removeChild(overlay);
      cancelCallback && cancelCallback();
    };
    
    // 组合弹窗元素
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(confirmBtn);
    dialog.appendChild(titleElem);
    dialog.appendChild(img);
    dialog.appendChild(messageElem);
    dialog.appendChild(buttonContainer);
    overlay.appendChild(dialog);
    
    // 添加到body
    document.body.appendChild(overlay);
  }

  // 头像上传
  const avatarInput = document.getElementById("avatar-input");
  const userAvatar = document.getElementById("user-avatar");

  // 从localStorage加载头像
  if (userAvatar) {
    const savedAvatar = localStorage.getItem('userAvatar');
    if (savedAvatar) {
      userAvatar.src = savedAvatar;
      // ！！通知其他组件（如侧栏）更新头像
      const avatarUpdateEvent = new CustomEvent('user-avatar-updated', {
        detail: { avatarSrc: savedAvatar }
      });
      document.dispatchEvent(avatarUpdateEvent);
    }
  }

  if (avatarInput && userAvatar) {
    avatarInput.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        // 检查文件大小限制为2MB
        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
          displaySaveMessage("图片大小不能超过2MB", "error");
          this.value = "";
          return;
        }
        
        // 检查文件类型
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
          displaySaveMessage("请选择图片文件 (JPG, PNG, GIF)", "error");
          this.value = "";
          return;
        }
        
        const reader = new FileReader();
        const inputElement = this;
        
        reader.onload = function (e) {
          const avatarSrc = e.target.result;
          
          // 使用自定义确认对话框
          createCustomConfirmDialog(
            "更改头像",
            avatarSrc,
            "确定使用此图片作为您的新头像吗？",
            // 确认回调
            function() {
              // 更新头像
              userAvatar.src = avatarSrc;
              
              // 保存头像
              localStorage.setItem('userAvatar', avatarSrc);
              const avatarUpdateEvent = new CustomEvent('user-avatar-updated', {
                detail: { avatarSrc: avatarSrc }
              });
              document.dispatchEvent(avatarUpdateEvent);
              
              // 显示成功消息
              displaySaveMessage("头像已更新");
            },
            // 取消操作
            function() {
              inputElement.value = "";
            }
          );
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // 修改密码
  const changePasswordBtn = document.getElementById("change-password-btn");
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener("click", function () {
      window.showNotification("\"修改密码\"功能暂未实现", "info");
    });
  }
  // 更换手机号
  const changePhoneBtn = document.getElementById("change-phone-btn");
  if (changePhoneBtn) {
    changePhoneBtn.addEventListener("click", function () {
      window.showNotification("\"更换手机\"功能暂未实现", "info");
    });
  }

  function displaySaveMessage(message, type = "success") {
    window.showNotification(message, type);
  }
});

import { Sidebar } from "/components/sidebar/sidebar.js";
import { Header } from "/components/header/header.js";

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = new Sidebar("sidebar-container");
  const header = new Header("header-container", {
    title: "个人资料",
    subtitle: "管理你的个人信息和偏好设置",
  });
});
