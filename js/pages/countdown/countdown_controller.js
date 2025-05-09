// 考试倒计时主控制器
// 协调其他倒计时模块，提供主要接口

import { loadExams, saveExams, getAllExams, getExamStatus } from '/js/pages/countdown/countdown_data.js';
import { initCountdownEvents, applyFiltersAndSort } from '/js/pages/countdown/countdown_events.js';
import { initScrollAnimation } from '/components/scrollAnimation/scrollAnimation.js';

// 存储DOM元素引用
let countdownElements = {};

/**
 * 初始化倒计时模块
 */
export function initCountdown() {
  try {
    
    // 获取DOM元素引用
    collectDOMElements();
    
    // 加载考试数据
    loadExams();
    
    // 注册window全局方法（这些方法会在HTML中直接调用）
    registerGlobalMethods();
    
    // 初始化滚动动画
    initScrollAnimation(".animate-on-scroll", {
      threshold: 0.1,
      once: true,
    });
    
    // 初始化事件处理
    initCountdownEvents(countdownElements);
    
    return true;
  } catch (error) {
    // 显示错误信息
    if (countdownElements.countdownList) {
      countdownElements.countdownList.innerHTML = `
        <div class="alert alert-danger">
          <h4>初始化数据失败</h4>
          <p>${error.message}</p>
          <p>请检查控制台获取详细信息</p>
        </div>
      `;
    }
    
    if (window.showNotification) {
      window.showNotification("初始化考试倒计时数据失败，请刷新页面重试", "error");
    }
    
    return false;
  }
}

/**
 * 收集页面上的DOM元素引用
 */
function collectDOMElements() {
  countdownElements = {
    countdownList: document.getElementById("countdown-list"),
    emptyState: document.getElementById("empty-state"),
    examModal: document.getElementById("exam-modal"),
    closeExamModalBtn: document.getElementById("close-exam-modal"),
    cancelExamBtn: document.getElementById("cancel-exam"),
    examForm: document.getElementById("exam-form"),
    modalTitle: document.getElementById("modal-title"),
    examIdInput: document.getElementById("exam-id"),
    addExamEmptyBtn: document.getElementById("add-exam-empty"),
    searchInput: document.getElementById("search-input"),
    sortSelect: document.getElementById("sort-select"),
    filterSelect: document.getElementById("filter-select"),
    clearSortBtn: document.getElementById("clear-sort"),
    clearFilterBtn: document.getElementById("clear-filter")
  };
  
  // 验证关键元素是否存在
  if (!countdownElements.countdownList) {
    throw new Error("关键DOM元素 'countdown-list' 未找到");
  }
  
  // 简化非关键元素的检测逻辑，移除 console.warn
  if (!countdownElements.emptyState) {
    // 可以创建一个简单的空白状态元素或者静默失败
  }
}

/**
 * 注册全局方法，使HTML中可以直接调用
 */
function registerGlobalMethods() {
  window.getExamStatus = getExamStatus;
  
  // 其他可能需要全局访问的方法也可以在这里注册
}

/**
 * 刷新考试列表显示
 */
export function refreshCountdownList() {
  applyFiltersAndSort();
}

/**
 * 获取所有考试数据
 * @returns {Array}
 */
export function getExams() {
  return getAllExams();
}