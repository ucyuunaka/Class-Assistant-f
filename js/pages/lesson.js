import { checkFirstLoginExperience } from '/js/auth.js';
import { getAllCourses, subscribeToCourseUpdates, loadScheduleFromStorage } from "/js/pages/schedule/schedule_data.js";
import { initScrollAnimation } from "/components/scrollAnimation/scrollAnimation.js";
import { Sidebar } from "/components/sidebar/sidebar.js";
import { Header } from "/components/header/header.js";

let showNotification;

// 初始化变量
let reactionMap = new Map(); // 存储用户选择的表情
let selectedPredefinedTags = new Set(); // 存储用户选择的预设标签
const predefinedTagsList = ["内容有趣", "讲解清晰", "互动性强", "有点难懂", "收获很大", "节奏太快", "案例实用"]; // 预设标签列表
const STORAGE_KEY = "classAssistant_lessonComments"; // 存储评价数据的键名

// DOM元素
let courseSelect;
let messageList;
let selectedReactions;
let emojiButton;
let sendButton;
let commentInput;
let predefinedTagsContainer;
let emojiPicker;
let usingFallbackPicker = false; // 标记是否使用备用emoji选择器

// 初始化函数
document.addEventListener("DOMContentLoaded", function () {
// 检查首次登录体验
//   checkFirstLoginExperience(); // 调试时临时注释掉
  // 尝试获取通知功能
  if (window.showNotification) {
    showNotification = window.showNotification;
  } else {
    // 创建备用通知函数
    showNotification = (message, type) => {
      alert(message);
    };
  }

  // 初始化界面元素
  initUI(); // 首先获取DOM元素
  const sidebar = new Sidebar("sidebar-container");
  const header = new Header("header-container", {
    title: "课评速记",
    subtitle: "记录并与大家分享您的课程评价",
  });

  // 初始化表情选择器
  initEmojiPicker();
  
  // 添加表情按钮直接调试
  debugEmojiButton();

  // 添加示例评价数据
  addSampleComments();

  loadScheduleFromStorage();
  
  // 加载课程数据
  renderOptionalCourses();

  // 渲染预设标签
  renderPredefinedTags();

  // 初始化事件监听
  initEvents();

  // 订阅课程数据变化
  subscribeToCourseUpdates(handleCourseUpdates);

  // 添加页面可见性事件监听，确保切换回页面时刷新数据
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // 添加页面获得焦点时的监听，确保从其他页面回来时能刷新数据
  window.addEventListener('focus', reloadCoursesData);

  // 在页面加载后短暂延时再次刷新课程数据，确保获取到最新添加的课程
  setTimeout(reloadCoursesData, 1000);

  // 监听主题变化
  listenForThemeChanges();

  // 立即应用当前主题
  const currentTheme = document.body.getAttribute('data-theme') || 'classic-blue-pink';
  updateLessonUIForTheme(currentTheme);
  
  // 加载保存的评价数据
  loadComments();

  // 在所有内容加载和初始化后，调用一次滚动动画
  setTimeout(() => {
    if (typeof initScrollAnimation === 'function') {
      initScrollAnimation(".animate-on-scroll", {
        threshold: 0.15,
        once: false
      });
    }
  }, 500);
});

// 初始化UI元素
function initUI() {
  courseSelect = document.getElementById("courseSelect");
  messageList = document.getElementById("commentList");
  selectedReactions = document.getElementById("selectedReactions");
  emojiButton = document.getElementById("emojiButton");
  sendButton = document.getElementById("sendButton");
  commentInput = document.getElementById("commentInput");
  predefinedTagsContainer = document.getElementById("predefinedTags");
  emojiPicker = document.getElementById("emojiPickerContainer");

  // 检查元素是否存在
  if (!courseSelect || !messageList || !selectedReactions || !emojiButton || !sendButton || !commentInput || !predefinedTagsContainer) {
    console.error("初始化失败: 未找到必要的DOM元素");
    showNotification("页面加载出现问题，请刷新重试", "error");
  }
  
  // 额外检查emoji按钮
  if (emojiButton) {
    
    // 按钮所在的容器相对定位
    const actionsContainer = emojiButton.closest('.input-actions');
    if (actionsContainer) {
      actionsContainer.style.position = 'relative';
    }
    
    // 按钮可点击
    emojiButton.style.pointerEvents = "auto";
    emojiButton.style.cursor = "pointer";
    emojiButton.style.zIndex = "100";
    
    // 添加高亮效果
    emojiButton.addEventListener("mouseenter", function() {
      this.style.backgroundColor = "var(--primary-light, #e6f7ff)";
    });
    
    emojiButton.addEventListener("mouseleave", function() {
      this.style.backgroundColor = "";
    });
  } else {
    console.error("找不到emoji按钮!");
  }
}

// 渲染预设标签
function renderPredefinedTags() {
  if (!predefinedTagsContainer) return;
  const label = predefinedTagsContainer.querySelector('.tag-label');
  predefinedTagsContainer.innerHTML = '';
  if (label) {
    predefinedTagsContainer.appendChild(label); // 重新添加标签文本
  }

  predefinedTagsList.forEach(tagText => {
    const tagElement = document.createElement("span");
    tagElement.className = "predefined-tag";
    tagElement.textContent = tagText;
    tagElement.dataset.tag = tagText;

    // 添加点击事件处理
    tagElement.addEventListener('click', () => togglePredefinedTag(tagElement));

    predefinedTagsContainer.appendChild(tagElement);
  });
}

// 切换预设标签选中状态
function togglePredefinedTag(tagElement) {
  const tagText = tagElement.dataset.tag;
  if (selectedPredefinedTags.has(tagText)) {
    selectedPredefinedTags.delete(tagText);
    tagElement.classList.remove('selected');
  } else {
    selectedPredefinedTags.add(tagText);
    tagElement.classList.add('selected');
  }
}


// 初始化事件监听
function initEvents() {
  if (sendButton) {
    sendButton.addEventListener("click", sendComment);
  }
  window.addEventListener('resize', handleResize);
}

// 处理窗口大小变化
function handleResize() {
  // 【备用】调整UI布局或元素大小
}

// 加载课程数据并渲染到选择框
function renderOptionalCourses() {
  try {
    // 获取最新课程数据
    const courses = getAllCourses();

    if (!courseSelect) {
      console.error("无法找到课程选择框元素");
      return;
    }

    // 完全清空所有选项，包括默认选项和分组
    courseSelect.innerHTML = '';
    
    // 重新添加默认选项
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "选择课程...";
    defaultOption.selected = true;
    courseSelect.appendChild(defaultOption);

    // 如果没有课程数据，显示提示信息
    if (!courses || courses.length === 0) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "暂无课程数据";
      option.disabled = true;
      courseSelect.appendChild(option);
      
      console.warn("未找到任何课程数据");
      
      // 显示通知
      if (typeof showNotification === 'function') {
        showNotification("请先在课表页面添加课程", "info", 5000);
      }
      return;
    }

    // 添加课程分组和选项
    let categories = new Map();
    
    // 首先整理课程到不同分类
    courses.forEach(course => {
      const category = course.category || "其他课程";
      if (!categories.has(category)) {
        categories.set(category, []);
      }
      categories.get(category).push(course);
    });
    
    // 如果没有任何分类（极端情况），将所有课程归为"其他课程"
    if (categories.size === 0 && courses.length > 0) {
      categories.set("其他课程", courses);
    }
    
    // 按分类创建选项组
    categories.forEach((categoryCourses, categoryName) => {
      const group = document.createElement("optgroup");
      group.label = categoryName;
        // 添加该分类下的所有课程
      categoryCourses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.title;
        option.textContent = course.title;
        // 添加额外数据属性供样式使用
        if (course.color) {
          option.dataset.color = course.color;
        }
        group.appendChild(option);
      });
      
      courseSelect.appendChild(group);
    });
    
    // 应用自定义样式到选择框
    applySelectBoxStyles();
  } catch (error) {
    console.error("加载课程数据失败:", error);
    
    // 显示错误通知
    if (typeof showNotification === 'function') {
      showNotification("加载课程数据失败", "error");
    }
  }
}

// 应用自定义样式到选择框
function applySelectBoxStyles() {
  if (!courseSelect) return;
  
  // 使用Select2库美化下拉框
  if (typeof $ !== 'undefined' && $.fn.select2) {
    try {
      try {
        if ($(courseSelect).hasClass('select2-hidden-accessible')) {
          $(courseSelect).select2('destroy');
        } else {
        }
      } catch (e) {
        // 【备用】如果没有实例，销毁会出错，但可以忽略这个错误
      }
      
      // 重新初始化Select2
      $(courseSelect).select2({
        placeholder: "选择课程...",
        allowClear: true,
        width: '100%',
        dropdownCssClass: 'course-select-dropdown'
      });
      
    } catch (e) {
      console.warn("Select2初始化失败，使用原生下拉框", e);
      courseSelect.classList.add('enhanced-select');
    }
  } else {
    courseSelect.classList.add('enhanced-select');
  }
}

// 初始化表情选择器
function initEmojiPicker() {
  
  // 注：此功能已被debugEmojiButton函数替代
  // 保留此函数以避免修改过多代码结构
  
  // 清理旧选择器
  const oldPicker = document.getElementById("emojiFallback");
  if (oldPicker && oldPicker.parentNode) {
    oldPicker.parentNode.removeChild(oldPicker);
  }
}

// 添加表情反应
function addReaction(emoji) {
  if (!selectedReactions) {
    return;
  }

  if (!reactionMap.has(emoji)) {
    reactionMap.set(emoji, 1); // 暂时将计数设为1，后续可扩展

    const reactionTag = document.createElement("div");
    reactionTag.className = "reaction-tag";
    reactionTag.dataset.emoji = emoji;
    reactionTag.innerHTML = `
      <span class="reaction-emoji">${emoji}</span>
      <span class="remove"><i class="fas fa-times"></i></span>
    `;

    // 点击删除标签
    reactionTag.querySelector(".remove").addEventListener("click", (e) => {
      e.stopPropagation();
      reactionMap.delete(emoji);
      reactionTag.remove();
    });

    selectedReactions.appendChild(reactionTag);
    
    // 添加动画效果
    setTimeout(() => {
      reactionTag.classList.add('visible');
    }, 10);
  }
  
  // 关闭表情选择器
  const fallbackPicker = document.getElementById("emojiFallback");
  if (fallbackPicker) {
    fallbackPicker.style.display = "none";
  } else {
  }
}

// 从localStorage加载评价
function loadComments() {
  try {
    // 从本地存储获取评价
    const commentsJSON = localStorage.getItem(STORAGE_KEY);
    const comments = commentsJSON ? JSON.parse(commentsJSON) : [];
    
    const commentList = document.getElementById('commentList');
    
    // 清空现有的评价列表，确保不会重复显示
    commentList.innerHTML = '';
    
    if (comments.length === 0) {
      // 如果没有评价，显示空提示
      const emptyElement = document.createElement('div');
      emptyElement.className = 'lesson-empty animate-on-scroll zoom-in';
      emptyElement.innerHTML = `
        <div class="lesson-empty-icon">
          <i class="ri-chat-3-line"></i>
        </div>
        <div class="lesson-empty-text">还没有匹配的课程评价</div>
      `;
      commentList.appendChild(emptyElement);
    } else {
      // 渲染所有评价
      comments.forEach(comment => {
        addCommentToUI(comment);
      });
    }
    
    return comments;
  } catch (error) {
    console.error('加载评价数据时出错:', error);
    showNotification('加载历史评价失败', 'error');
    return [];
  }
}

// 保存评价到localStorage
function saveComment(comment) {
  try {
    // 获取现有评价
    let comments = [];
    const savedComments = localStorage.getItem(STORAGE_KEY);
    if (savedComments) {
      comments = JSON.parse(savedComments);
    }
    
    // 构建结构一致的评价对象
    const newComment = {
      id: comment.id || Date.now().toString(),
      timestamp: comment.timestamp || new Date().toISOString(),
      course: comment.course,
      text: comment.text,
      reactions: comment.reactions || {},
      tags: comment.tags || []
    };
    
    // 添加新评价到开头
    comments.unshift(newComment);
    
    // 保存回localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    
    return true;
  } catch (error) {
    return false;
  }
}

// 添加评价到UI
function addCommentToUI(comment, prepend = false) {
  const commentList = document.getElementById('commentList');
  const empty = commentList.querySelector('.lesson-empty');

  // 如果存在"空评价"提示，则移除
  if (empty) {
    empty.remove();
  }

  // 创建评价项容器
  const commentItem = document.createElement('div');
  commentItem.className = 'comment-item animate-on-scroll fade-up';
  commentItem.dataset.id = comment.id; // 添加id以便后续引用
  
  // 格式化时间
  const time = formatTime(new Date(comment.timestamp || Date.now()).getTime());
  
  // 构建评价HTML
  let html = `
    <div class="comment-header">
      <div class="comment-course">${comment.course || '未指定课程'}</div>
      <div class="comment-time">${time}</div>
    </div>
  `;
  
  // 添加评价文本
  if (comment.text) {
    html += `<div class="comment-message">${comment.text}</div>`;
  }
  
  // 添加表情反应
  if (comment.reactions && Object.keys(comment.reactions).length > 0) {
    html += `
      <div class="comment-reactions">
        ${Object.entries(comment.reactions).map(([emoji, count]) => {
          const userReacted = comment.userReactions && comment.userReactions.includes(emoji) ? 'user-reacted' : '';
          return `<div class="reaction-bubble ${userReacted}" data-emoji="${emoji}" data-count="${count}">
            <span class="reaction-emoji">${emoji}</span>
            <span class="reaction-count">${count}</span>
          </div>`;
        }).join('')}
      </div>
    `;
  }
  
  // 添加标签
  if (comment.tags && comment.tags.length > 0) {
    html += `
      <div class="comment-tags">
        ${comment.tags.map(tag => `<span class="comment-tag">${tag}</span>`).join('')}
      </div>
    `;
  }
  
  commentItem.innerHTML = html;

  // 根据prepend参数决定插入位置
  if (prepend) {
    commentList.insertBefore(commentItem, commentList.firstChild);
  } else {
    commentList.appendChild(commentItem);
  }

  // 为表情反应添加点击事件
  const reactionBubbles = commentItem.querySelectorAll('.reaction-bubble');
  reactionBubbles.forEach(bubble => {
    bubble.addEventListener('click', handleReactionClick);
  });

  // 立即显示评价
  setTimeout(() => {
    commentItem.classList.add('visible');
  }, 10);

  return commentItem;
}

// 处理表情点击事件
function handleReactionClick(event) {
  const bubble = event.currentTarget;
  const emoji = bubble.dataset.emoji;
  const commentItem = bubble.closest('.comment-item');
  const commentId = commentItem.dataset.id;
  
  // 获取当前计数
  let count = parseInt(bubble.dataset.count || '0');
  const wasReacted = bubble.classList.contains('user-reacted');
  
  // 如果用户已经点击过，则移除反应；否则添加反应
  if (wasReacted) {
    // 用户已经点击过，减少计数
    count = Math.max(1, count - 1); // 确保计数至少为1
    bubble.classList.remove('user-reacted');
    // 更新存储
    removeUserReaction(commentId, emoji);
  } else {
    // 用户未点击过，增加计数
    count += 1;
    bubble.classList.add('user-reacted');
    bubble.classList.add('animate');
    
    // 添加emoji弹跳动画
    const emojiElement = bubble.querySelector('.reaction-emoji');
    emojiElement.classList.add('bump');
    setTimeout(() => {
      emojiElement.classList.remove('bump');
    }, 400);
    
    // 添加计数变化动画
    const countElement = bubble.querySelector('.reaction-count');
    countElement.classList.add('increment');
    setTimeout(() => {
      countElement.classList.remove('increment');
    }, 500);
    
    // 移除动画类，以便下次点击时可以再次触发
    setTimeout(() => {
      bubble.classList.remove('animate');
    }, 500);
    
    // 更新存储
    addUserReaction(commentId, emoji);
  }
  
  // 更新显示的计数
  bubble.dataset.count = count.toString();
  const countElement = bubble.querySelector('.reaction-count');
  countElement.textContent = count.toString();
  
  // 更新评论中的反应计数
  updateReactionCount(commentId, emoji, count);
}

// 添加用户反应到评论
function addUserReaction(commentId, emoji) {
  try {
    // 获取现有评价
    const commentsJSON = localStorage.getItem(STORAGE_KEY);
    if (!commentsJSON) return;
    
    const comments = JSON.parse(commentsJSON);
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];
    
    // 初始化用户反应数组
    if (!comment.userReactions) {
      comment.userReactions = [];
    }
    
    if (!comment.userReactions.includes(emoji)) {
      comment.userReactions.push(emoji);
    }
    
    // 更新反应计数
    if (!comment.reactions) {
      comment.reactions = {};
    }
    
    comment.reactions[emoji] = (comment.reactions[emoji] || 0) + 1;
    
    // 保存回localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch (error) {
    console.error('添加用户反应时出错:', error);
  }
}

// 从评论中移除用户反应
function removeUserReaction(commentId, emoji) {
  try {
    // 获取现有评价
    const commentsJSON = localStorage.getItem(STORAGE_KEY);
    if (!commentsJSON) return;
    
    const comments = JSON.parse(commentsJSON);
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];
    
    // 如果用户反应数组存在且包含该表情，则移除
    if (comment.userReactions && comment.userReactions.includes(emoji)) {
      comment.userReactions = comment.userReactions.filter(e => e !== emoji);
      
      // 更新反应计数
      if (comment.reactions && comment.reactions[emoji]) {
        comment.reactions[emoji] = Math.max(1, comment.reactions[emoji] - 1);
      }
      
      // 保存回localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    }
  } catch (error) {
    console.error('移除用户反应时出错:', error);
  }
}

// 更新评论中的反应计数
function updateReactionCount(commentId, emoji, count) {
  try {
    // 获取现有评价
    const commentsJSON = localStorage.getItem(STORAGE_KEY);
    if (!commentsJSON) return;
    
    const comments = JSON.parse(commentsJSON);
    const commentIndex = comments.findIndex(c => c.id === commentId);
    if (commentIndex === -1) return;
    
    const comment = comments[commentIndex];
    
    // 更新反应计数
    if (!comment.reactions) {
      comment.reactions = {};
    }
    
    comment.reactions[emoji] = count;
    
    // 保存回localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
  } catch (error) {
  }
}

// 格式化时间显示
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays === 1) {
    return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  } else if (diffDays < 7) {
    return `${diffDays}天前`;
  } else {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  }
}

// 发送评价
function sendComment() {
  if (!courseSelect || !commentInput) return;

  const course = courseSelect.value;
  if (!course) {
    showNotification("请选择一个课程", "error");
    return;
  }

  // 获取评价文本
  const text = commentInput.value.trim();
  
  // 获取预设标签
  const tags = Array.from(selectedPredefinedTags);
  
  // 获取表情反应
  const reactions = {};
  for (const [emoji, count] of reactionMap.entries()) {
    reactions[emoji] = count;
  }
  
  // ！！至少有文本、表情或标签之一，才能成功发送评价
  if (text === "" && Object.keys(reactions).length === 0 && tags.length === 0) {
    showNotification("请输入评价内容、选择表情或标签", "error");
    return;
  }

  // 创建评价数据对象
  const commentData = {
    id: Date.now().toString(),
    timestamp: new Date().toISOString(),
    course: course,
    text: text,
    reactions: reactions,
    tags: tags
  };

  try {
    // 保存评价到本地存储
    const saved = saveComment(commentData);
    
    if (saved) {
      // 直接将新评价添加到UI
      addCommentToUI(commentData, true);
      
      // 清除表单
      commentInput.value = '';
      selectedReactions.innerHTML = '';
      reactionMap.clear();
      selectedPredefinedTags.clear();
      
      // 重置预设标签选中状态
      document.querySelectorAll('.predefined-tag').forEach(tag => {
        tag.classList.remove('selected');
      });
      
      showNotification("评价已发送", "success");
    } else {
      throw new Error("保存失败");
    }
  } catch (error) {
    console.error("发送评价失败:", error);
    showNotification("评价保存失败", "error");
  }
}

// 处理课程数据更新
function handleCourseUpdates() {
  renderOptionalCourses();
}

// 监听主题变化事件
function listenForThemeChanges() {
  window.addEventListener('themeChanged', function(event) {
    const newTheme = event.detail.theme;
    updateLessonUIForTheme(newTheme);
  });
}

// 根据主题更新UI元素
function updateLessonUIForTheme(theme) {
  
  const messageElements = document.querySelectorAll('.message');
  
  messageElements.forEach((msg, index) => {
    // 根据主题给消息添加不同的视觉效果
    if (theme.includes('dark')) {
      // 深色主题
      msg.style.borderLeftWidth = '3px';
      msg.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.2)';
    } else {
      // 浅色主题
      msg.style.borderLeftWidth = '4px';
      msg.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    }
    
    // 交替消息样式
    if (index % 2 === 0) {
      msg.classList.add('even');
    } else {
      msg.classList.add('odd');
    }
  });
  
  // 更新表情选择器样式
  const emojiPicker = document.getElementById('emojiFallback');
  if (emojiPicker) {
    if (theme.includes('dark')) {
      emojiPicker.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    } else {
      emojiPicker.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.15)';
    }
  }
}

// 【调试】表情按钮调试
function debugEmojiButton() {
  const emojiBtn = document.getElementById("emojiButton");
  if (!emojiBtn) {
    console.error("调试: 无法找到emoji按钮");
    return;
  }
  
  // 直接使用本地表情
  const emojiList = ["😊", "😂", "😍", "👍", "👎", "❤️", "🔥", "🎉", "👏", "🤔", "😢", "😎", "🙏", "💡", "⭐", "🚀"];
  
  // 获取按钮所在的容器
  const actionsContainer = emojiBtn.closest('.input-actions');
  if (!actionsContainer) {
    console.error("调试: 无法找到按钮容器");
    return;
  }
  
  // 添加辅助定位类
  actionsContainer.classList.add('emoji-picker-wrapper');
  
  // 获取或创建一个选择器容器
  let pickerContainer = document.getElementById("emojiPickerContainer");
  if (pickerContainer) {
    if (pickerContainer.parentNode !== document.body) {
      document.body.appendChild(pickerContainer);
    }
  } else {
    // 创建一个新的容器
    pickerContainer = document.createElement('div');
    pickerContainer.id = "emojiPickerContainer";
    pickerContainer.className = "emoji-picker-container";
    document.body.appendChild(pickerContainer);
  }
  
  // 添加滚动事件监听，确保表情选择器跟随
  window.addEventListener('scroll', updatePickerPosition, { passive: true });
  window.addEventListener('resize', updatePickerPosition, { passive: true });
  
  // ！！辅助函数 - 更新选择器位置
  function updatePickerPosition() {
    const fallbackPicker = document.getElementById("emojiFallback");
    if (fallbackPicker && fallbackPicker.style.display === "block") {
      const btnRect = emojiBtn.getBoundingClientRect();
      
      fallbackPicker.style.position = "fixed";
      fallbackPicker.style.top = (btnRect.bottom + 5) + "px";
      fallbackPicker.style.left = btnRect.left + "px";
      
      // 如果表情选择器超出右边界，则向左偏移
      const viewportWidth = window.innerWidth;
      if (btnRect.left + 320 > viewportWidth) {
        const rightOverflow = (btnRect.left + 320) - viewportWidth;
        fallbackPicker.style.left = (btnRect.left - rightOverflow - 20) + "px";
      }
    }
  }
  
  // 添加直接点击事件，独立于其他事件处理
  emojiBtn.addEventListener("click", function(e) {
    e.stopPropagation();
    e.preventDefault();
  
    
    // 获取或创建一个简单的fallback选择器
    let fallbackPicker = document.getElementById("emojiFallback");
    if (!fallbackPicker) {
      fallbackPicker = document.createElement("div");
      fallbackPicker.id = "emojiFallback";
      fallbackPicker.className = "emoji-fallback";
      
      const grid = document.createElement("div");
      grid.className = "emoji-grid";
      emojiList.forEach(emoji => {
        const item = document.createElement("div");
        item.className = "emoji-item";
        item.textContent = emoji;
        item.style.fontSize = "24px";
        item.style.padding = "8px";
        item.style.cursor = "pointer";
        item.style.textAlign = "center";
        
        item.addEventListener("click", function(evt) {
          evt.stopPropagation();
          addReaction(emoji);
          fallbackPicker.style.display = "none";
        });
        
        grid.appendChild(item);
      });
      
      grid.style.display = "grid";
      grid.style.gridTemplateColumns = "repeat(4, 1fr)";
      grid.style.gap = "8px";
      
      fallbackPicker.appendChild(grid);
      pickerContainer.appendChild(fallbackPicker);
    }
    
    fallbackPicker.style.position = "fixed";
    fallbackPicker.style.zIndex = "10001";
    fallbackPicker.style.width = "320px";
    fallbackPicker.style.maxHeight = "300px";
    fallbackPicker.style.overflowY = "auto";
    fallbackPicker.style.backgroundColor = "var(--background-secondary, white)";
    fallbackPicker.style.border = "1px solid var(--border-color, #ccc)";
    fallbackPicker.style.borderRadius = "8px";
    fallbackPicker.style.padding = "10px";
    fallbackPicker.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
    
    // 设置选择器位置，使其显示在按钮下方
    const btnRect = emojiBtn.getBoundingClientRect();
    fallbackPicker.style.top = (btnRect.bottom + 5) + "px";
    fallbackPicker.style.left = btnRect.left + "px";
    
    // 检查是否会超出右边界
    const viewportWidth = window.innerWidth;
    if (btnRect.left + 320 > viewportWidth) {
      // 如果会超出右边界，则显示在左边
      const rightOverflow = (btnRect.left + 320) - viewportWidth;
      fallbackPicker.style.left = (btnRect.left - rightOverflow - 20) + "px";
    }
    
    // 切换显示
    if (fallbackPicker.style.display === "block") {
      fallbackPicker.style.display = "none";
    } else {
      fallbackPicker.style.display = "block";
      
      // 点击外部区域关闭选择器
      const handleClickOutside = function(event) {
        if (!fallbackPicker.contains(event.target) && event.target !== emojiBtn) {
          fallbackPicker.style.display = "none";
          document.removeEventListener("click", handleClickOutside);
        }
      };
      
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 50);
    }
  }, true);
}

// 添加示例评价数据
function addSampleComments() {
  try {
    // 检查是否已经有评价数据
    const commentsJSON = localStorage.getItem(STORAGE_KEY);
    const comments = commentsJSON ? JSON.parse(commentsJSON) : [];
    
    // 如果已经有评价数据，则不添加示例
    if (comments.length > 0) {
      return;
    }
    
    // 示例评价数据
    const sampleComments = [
      {
        id: "sample-001",
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 实际显示“3天前”
        course: "数据结构与算法",
        text: "老师讲解非常清晰，课堂示例贴近实际应用，特别是红黑树的实现部分讲得很透彻。课程难度适中，作业量刚好。",
        reactions: {
          "👍": 15,
          "🔥": 8,
          "💯": 6,
          "🧠": 4
        },
        tags: ["讲解清晰", "内容有趣", "收获很大"]
      },
      {
        id: "sample-002",
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        course: "计算机网络",
        text: "这门课程深入浅出，从TCP/IP协议到网络安全都有涉及。老师经验丰富，能用生动的例子解释复杂概念。实验环节设计很棒，帮助加深了对理论的理解。",
        reactions: {
          "👏": 12,
          "⭐": 9,
          "👨‍💻": 3
        },
        tags: ["互动性强", "案例实用"]
      },
      {
        id: "sample-003",
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        course: "操作系统原理",
        text: "操作系统的课程内容很全面，但节奏有点快。进程管理和内存管理部分讲得非常好，但文件系统部分感觉有些赶。课堂练习很有挑战性，能够锻炼思维。",
        reactions: {
          "🤔": 7,
          "💡": 5,
          "📚": 3,
          "🚀": 2
        },
        tags: ["节奏太快", "有点难懂", "收获很大"]
      },
      {
        id: "sample-004",
        timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        course: "前端开发实践",
        text: "实用性很强的一门课，React和Vue的部分讲得很接地气。课堂项目设计巧妙，能学到很多工程实践经验。希望JavaScript高级特性能多讲一些。",
        reactions: {
          "🔥": 18,
          "👨‍💻": 10,
          "👍": 8,
          "🎉": 5
        },
        tags: ["内容有趣", "案例实用"]
      },
      {
        id: "sample-005",
        timestamp: new Date().toISOString(),
        course: "机器学习基础",
        text: "理论与实践结合得很好，从基础算法到实际应用都有覆盖。Python代码示例清晰易懂，作业布置合理，能够检验学习效果。期待后续的深度学习课程。",
        reactions: {
          "🧠": 14,
          "💡": 9,
          "⭐": 6,
          "👏": 4
        },
        tags: ["讲解清晰", "收获很大"]
      },
      {
        id: "sample-006",
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        text: "敏捷开发和设计模式的部分讲得很好，团队项目也很锻炼人。不过感觉测试驱动开发部分讲得有点浅，希望能有更多实际案例。",
        reactions: {
          "👨‍🏫": 5,
          "📝": 7,
          "🏆": 3
        },
        tags: ["互动性强"]
      }
    ];
    
    // 保存到localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleComments));
    
  } catch (error) {
    console.error("添加示例评价数据出错:", error);
  }
}

// 处理页面可见性变化
function handleVisibilityChange() {
  if (document.visibilityState === 'visible') {
    // 当页面重新可见时，重载课程数据
    if (typeof $ !== 'undefined' && $.fn.select2 && courseSelect) {
      try {
        // 先检查是否已经初始化了Select2
        if ($(courseSelect).hasClass('select2-hidden-accessible')) {
          $(courseSelect).select2('destroy');
        } else {
        }
      } catch (e) {
      }
    } 
    // 重载课程数据
    reloadCoursesData();
  }
}

// 重新加载课程数据
function reloadCoursesData() {
  try {
    // 从localStorage重新加载最新的课程数据
    const loaded = loadScheduleFromStorage();
    if (loaded) {
    } else {
    }
    if (typeof $ !== 'undefined' && $.fn.select2 && courseSelect) {
      try {
        // 先检查元素是否已经初始化了Select2
        if ($(courseSelect).hasClass('select2-hidden-accessible')) {
          $(courseSelect).select2('destroy');
        } else {
        }
      } catch (e) {
      }
    }
    // 不管是否成功加载，都尝试更新选择框
    renderOptionalCourses();
  } catch (error) {

  }
}
