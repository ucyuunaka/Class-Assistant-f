// 考试倒计时事件处理模块
import { loadExams, saveExams, getAllExams, formatDate, deleteExam, undoDeleteExam, updateExam, addExam } from '/js/pages/countdown/countdown_data.js';
import { renderExamList, startCountdownTimer, animateFilterChange } from '/js/pages/countdown/countdown_render.js';

// DOM元素引用
let countdownList;
let emptyState;
let examModal;
let examIdInput;
let searchInput;
let sortSelect;
let filterSelect;
let clearSortBtn;
let clearFilterBtn;
let modalTitle;
let examForm;

// 存储筛选后的考试数据
let processedExams = [];

/**
 * 初始化倒计时事件处理
 * @param {Object} elements
 */
export function initCountdownEvents(elements) {
  countdownList = elements.countdownList;
  emptyState = elements.emptyState;
  examModal = elements.examModal;
  examIdInput = elements.examIdInput;
  searchInput = elements.searchInput;
  sortSelect = elements.sortSelect;
  filterSelect = elements.filterSelect;
  clearSortBtn = elements.clearSortBtn;
  clearFilterBtn = elements.clearFilterBtn;
  modalTitle = elements.modalTitle;
  examForm = elements.examForm;
  
  // 加载考试数据
  loadExams();
  
  // 绑定事件处理
  bindEventHandlers(elements);
  
  // 加载用户筛选偏好
  ensurePastOptionExists();
  loadSortFilterPreference();
  
  // 初始渲染
  applyFiltersAndSort();
  
  // 监听模态框加载完成事件
  document.addEventListener("modals:ready", function() {
  });
  
  window.openEditExamModal = openEditExamModal;
  window.deleteExam = handleDeleteExam;
  
  return {
    openAddExamModal,  // 供外部使用的备用
    openEditExamModal,
    applyFiltersAndSort
  };
}

/**
 * 绑定事件处理器
 * @param {Object} elements
 */
function bindEventHandlers(elements) {
  // 添加考试按钮
  if (elements.addExamEmptyBtn) {
    elements.addExamEmptyBtn.addEventListener("click", openAddExamModal);
  }
  
  // 模态框关闭按钮
  if (elements.closeExamModalBtn) {
    elements.closeExamModalBtn.addEventListener("click", closeExamModal);
  }
  
  // 取消按钮
  if (elements.cancelExamBtn) {
    elements.cancelExamBtn.addEventListener("click", closeExamModal);
  }
  
  // 为header组件中的添加按钮绑定事件
  setTimeout(() => {
    const headerAddBtn = document.querySelector(".add-exam-btn");
    if (headerAddBtn) {
      headerAddBtn.addEventListener("click", (e) => {
        e.preventDefault();
        openAddExamModal();
      });
    }
  }, 500);
  
  // 点击模态框外部关闭
  window.addEventListener("click", (event) => {
    if (event.target === examModal) closeExamModal();
  });
  
  // 清除定时器（离开页面）
  window.addEventListener("beforeunload", () => {
    if (window.countdownInterval) {
      clearInterval(window.countdownInterval);
    }
  });
  
  // 表单提交处理
  if (examForm) {
    examForm.addEventListener("submit", handleExamFormSubmit);
    
    // 添加实时表单验证
    const examNameInput = document.getElementById("exam-name");
    const examDateInput = document.getElementById("exam-date");
    const examTimeInput = document.getElementById("exam-time");
    
    if (examDateInput) {
      examDateInput.addEventListener("blur", function() {
        validateInput(examDateInput, value => value !== "", "考试日期不能为空");
      });
      
      // 检查是否为过去的日期
      examDateInput.addEventListener("change", function() {
        validateDatetime(examDateInput, examTimeInput);
      });
    }
    
    if (examTimeInput) {
      examTimeInput.addEventListener("blur", function() {
        validateInput(examTimeInput, value => value !== "", "考试时间不能为空");
      });
      
      // 时间变更时也检查日期时间组合
      examTimeInput.addEventListener("change", function() {
        validateDatetime(examDateInput, examTimeInput);
      });
    }
  }
  
  // 筛选和排序处理
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      animateFilterChange(countdownList, applyFiltersAndSort);
    });
  }
  
  if (sortSelect) {
    sortSelect.addEventListener("change", () => {
      animateFilterChange(countdownList, applyFiltersAndSort);
    });
  }
  
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        animateFilterChange(countdownList, applyFiltersAndSort);
      }, 300); // 300ms防抖延迟
    });
  }
  
  // 清除按钮事件监听
  if (clearSortBtn) {
    clearSortBtn.addEventListener("click", () => {
      sortSelect.value = "date-desc";
      clearSortBtn.classList.add('active');
      setTimeout(() => clearSortBtn.classList.remove('active'), 300);
      animateFilterChange(countdownList, applyFiltersAndSort);
    });
  }
  
  if (clearFilterBtn) {
    clearFilterBtn.addEventListener("click", () => {
      filterSelect.value = "all";
      clearFilterBtn.classList.add('active');
      setTimeout(() => clearFilterBtn.classList.remove('active'), 300);
      animateFilterChange(countdownList, applyFiltersAndSort);
    });
  }
}

/**
 * 打开添加考试模态框
 */
export function openAddExamModal() {
  modalTitle.textContent = "添加考试";
  
  // 重置表单
  examForm.reset();
  examIdInput.value = "";
  
  // 默认日期设为今天
  const today = new Date().toISOString().split('T')[0];
  document.getElementById("exam-date").value = today;
  
  // 默认时间设为上午9点
  document.getElementById("exam-time").value = "09:00";
  
  // 清除所有错误状态
  clearAllFormErrors();
  
  // 显示模态框
  showModalWithAnimation();
}

/**
 * 打开编辑考试模态框
 * @param {Number} examId - 考试ID
 */
export function openEditExamModal(examId) {
  const exams = getAllExams();
  const exam = exams.find(e => e.id === Number(examId));
  if (!exam) {
    console.error("未找到ID为", examId, "的考试");
    return;
  }
  
  modalTitle.textContent = "编辑考试";
  
  // 填充表单
  document.getElementById("exam-name").value = exam.name || "";
  document.getElementById("exam-subject").value = exam.subject || "";
  
  // 处理日期和时间
  const examDate = new Date(exam.date);
  const dateStr = examDate.toISOString().split('T')[0];
  let timeStr = examDate.toTimeString().substring(0, 5);
  
  document.getElementById("exam-date").value = dateStr;
  document.getElementById("exam-time").value = timeStr;
  document.getElementById("exam-location").value = exam.location || "";
  document.getElementById("exam-notes").value = exam.notes || "";
  examIdInput.value = exam.id;
  
  // 清除所有错误状态
  clearAllFormErrors();
  
  // 检查填充的日期是否为过去时间
  const dateInput = document.getElementById("exam-date");
  const timeInput = document.getElementById("exam-time");
  validateDatetime(dateInput, timeInput);
  
  // 显示模态框
  showModalWithAnimation();
}

/**
 * 显示模态框并添加动画效果
 */
function showModalWithAnimation() {
  const modalContent = document.querySelector('.modal-content');
  examModal.style.display = "flex";
  examModal.style.alignItems = "center";
  examModal.style.justifyContent = "center";
  examModal.style.opacity = "0";
  examModal.classList.add('active');
  
  // 使用requestAnimationFrame，确保DOM更新后再添加动画
  requestAnimationFrame(() => {
    examModal.style.transition = "opacity 0.3s ease";
    examModal.style.opacity = "1";
    
    if (modalContent) {
      modalContent.style.opacity = "0";
      modalContent.style.transform = "translateY(-30px)";
      
      requestAnimationFrame(() => {
        modalContent.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        modalContent.style.opacity = "1";
        modalContent.style.transform = "translateY(0)";
      });
    }
  });
  
  // 聚焦到第一个输入框
  setTimeout(() => {
    const firstInput = document.getElementById("exam-name");
    if (firstInput) {
      firstInput.focus();
    }
  }, 350);
}

/**
 * 关闭考试模态框
 */
function closeExamModal() {
  // 添加淡出效果
  const modalContent = document.querySelector('.modal-content');
  
  examModal.style.transition = "opacity 0.3s ease";
  examModal.style.opacity = "0";
  examModal.classList.remove('active');
  
  if (modalContent) {
    modalContent.style.transition = "opacity 0.25s ease, transform 0.25s ease";
    modalContent.style.opacity = "0";
    modalContent.style.transform = "translateY(-20px)";
  }
  
  // 等待动画完成后隐藏整个模态框
  setTimeout(() => {
    examModal.style.display = "none";
    
    // 使用clearAllFormErrors函数清除所有表单错误
    clearAllFormErrors();
    
    document.body.style.overflow = '';
    
  }, 300);
}

/**
 * 处理考试表单提交
 * @param {Event} event - 提交事件对象
 */
function handleExamFormSubmit(event) {
  event.preventDefault();
  
  try {
    // 1. 收集表单数据
    const examName = document.getElementById("exam-name").value;
    const examSubject = document.getElementById("exam-subject").value;
    const examDate = document.getElementById("exam-date").value;
    const examTime = document.getElementById("exam-time").value;
    const examLocation = document.getElementById("exam-location").value;
    const examNotes = document.getElementById("exam-notes").value;
    const examId = examIdInput.value;
    
    // 2. 验证必填字段
    let isValid = true;
    
    if (!examName.trim()) {
      showInputError(document.getElementById("exam-name"), "考试名称不能为空");
      isValid = false;
    } else {
      clearInputError(document.getElementById("exam-name"));
    }
    
    if (!examDate) {
      showInputError(document.getElementById("exam-date"), "考试日期不能为空");
      isValid = false;
    } else {
      clearInputError(document.getElementById("exam-date"));
    }
    
    if (!examTime) {
      showInputError(document.getElementById("exam-time"), "考试时间不能为空");
      isValid = false;
    } else {
      clearInputError(document.getElementById("exam-time"));
    }
    
    // 3. 创建日期时间对象并验证是否为过去时间
    const dateTime = new Date(`${examDate}T${examTime}`);
    const now = new Date();
    
    // 4. 验证日期时间格式
    if (isNaN(dateTime.getTime())) {
      showInputError(document.getElementById("exam-date"), "无效的日期格式");
      isValid = false;
    } else if (dateTime < now) {
      // 如果是过去时间，显示错误提示
      showInputError(document.getElementById("exam-date"), "考试日期不能早于当前时间");
      isValid = false;
    } else {
      clearInputError(document.getElementById("exam-date"));
    }
    
    // 如果验证不通过，直接返回不提交
    if (!isValid) {
      return;
    }
    
    // 5. 准备考试数据对象
    const examData = {
      name: examName,
      subject: examSubject,
      date: dateTime.toISOString(),
      location: examLocation,
      notes: examNotes
    };
    
    // 直接保存考试数据
    saveExam(examData, examId);
  } catch (error) {
    // 显示错误通知
    if (typeof window.showNotification === "function") {
      window.showNotification("保存失败: " + error.message, "error", 5000);
    } else {
      alert("保存失败: " + error.message);
    }
  }
}

/**
 * 保存考试数据
 * @param {Object} examData - 考试数据
 * @param {String|Number} examId - 考试ID，为空时表示新增
 */
function saveExam(examData, examId) {
  // 显示保存中状态
  const saveBtn = examForm.querySelector('button[type="submit"]');
  const originalBtnText = saveBtn.innerHTML;
  
  if (saveBtn) {
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
    saveBtn.disabled = true;
  }
  
  // 使用setTimeout模拟网络延迟（更真实）
  setTimeout(() => {
    if (examId) {
      // 编辑现有考试
      updateExam(parseInt(examId), examData);
    } else {
      // 添加新考试
      const newExam = addExam(examData);
    }
    
    applyFiltersAndSort();
    
    // 关闭模态框
    closeExamModal();
    
    // 显示成功通知
    window.showNotification(
      examId ? "考试信息已成功更新" : "新考试已成功添加", 
      "success", 
      3000
    );
    
    if (saveBtn && saveBtn.isConnected) {
      saveBtn.innerHTML = originalBtnText;
      saveBtn.disabled = false;
    }
  }, 500);
}

/**
 * 处理删除考试操作
 * @param {Number} examId - 考试ID
 */
function handleDeleteExam(examId) {
  const exams = getAllExams();
  const examIndex = exams.findIndex(e => e.id === Number(examId));
  if (examIndex === -1) {
    console.error("未找到ID为", examId, "的考试");
    window.showNotification("未找到要删除的考试", "error", 3000);
    return;
  }
  
  const exam = exams[examIndex];
  
  // 创建确认删除对话框
  const confirmDialog = document.createElement('div');
  confirmDialog.className = 'modal confirm-dialog';
  confirmDialog.style.display = 'flex';
  confirmDialog.style.zIndex = '1100';
  
  confirmDialog.innerHTML = `
    <div class="modal-content" style="max-width: 400px;">
      <h3 class="mb-3">确认删除</h3>
      <p>你确定要删除考试 "<strong>${exam.name}</strong>" 吗？</p>
      <p class="text-secondary mt-2" style="font-size: 0.9rem;">此操作可撤销，但之后将无法恢复。</p>
      <div class="text-center mt-4">
        <button class="btn btn-danger confirm-delete-btn">删除</button>
        <button class="btn btn-outline cancel-delete-btn" style="margin-left: 1rem;">取消</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(confirmDialog);
  
  // 使模态框内容显示动画效果
  requestAnimationFrame(() => {
    const modalContent = confirmDialog.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.opacity = '1';
      modalContent.style.transform = 'translateY(0)';
    }
  });
  
  // 添加事件监听器
  const confirmBtn = confirmDialog.querySelector('.confirm-delete-btn');
  const cancelBtn = confirmDialog.querySelector('.cancel-delete-btn');
  
  // 确认删除
  confirmBtn.addEventListener('click', function() {
    // 记录考试名称用于通知
    const examName = exam.name;
    
    // 执行删除
    deleteExam(examId);
    
    // 刷新列表
    applyFiltersAndSort();
    
    // 关闭对话框
    document.body.removeChild(confirmDialog);
    
    // 显示通知
    window.showNotification(
      `已删除考试"${examName}"`, 
      "info", 
      5000
    );
    
    // 添加撤销按钮通知
    setTimeout(() => {
      // 创建自定义撤销通知
      const undoNotification = document.createElement('div');
      undoNotification.className = 'notification notification-info fade-in';
      undoNotification.innerHTML = `
        <div class="notification-content">
          <i class="fas fa-undo"></i>
          <span>可以撤销刚才的删除操作</span>
        </div>
        <button class="btn-sm btn-outline undo-btn">撤销</button>
        <button class="notification-close">&times;</button>
      `;
      
      // 添加到通知容器
      const notificationContainer = document.querySelector('.notification-container');
      if (notificationContainer) {
        notificationContainer.appendChild(undoNotification);
        
        // 添加撤销点击事件
        const undoBtn = undoNotification.querySelector('.undo-btn');
        if (undoBtn) {
          undoBtn.addEventListener('click', function() {
            handleUndoDeleteExam();
            undoNotification.classList.add('fade-out');
            setTimeout(() => undoNotification.remove(), 300);
          });
        }
        
        // 添加关闭按钮事件
        const closeBtn = undoNotification.querySelector('.notification-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            undoNotification.classList.add('fade-out');
            setTimeout(() => undoNotification.remove(), 300);
          });
        }
        
        // 设置自动消失
        setTimeout(() => {
          if (undoNotification.parentElement) {
            undoNotification.classList.add('fade-out');
            setTimeout(() => undoNotification.remove(), 300);
          }
        }, 10000);
      }
    }, 500);
  });
  
  // 取消删除
  cancelBtn.addEventListener('click', function() {
    document.body.removeChild(confirmDialog);
  });
  
  // 点击对话框外部关闭
  confirmDialog.addEventListener('click', function(event) {
    if (event.target === confirmDialog) {
      document.body.removeChild(confirmDialog);
    }
  });
}

/**
 * 处理撤销删除考试操作
 */
function handleUndoDeleteExam() {
  const restoredExam = undoDeleteExam();
  if (!restoredExam) {
    console.error("没有可撤销的删除操作");
    return;
  }
  
  // 刷新列表
  applyFiltersAndSort();
  
  // 显示成功通知
  window.showNotification(
    `已恢复考试"${restoredExam.name}"`, 
    "success", 
    3000
  );
}

/**
 * 应用筛选和排序
 */
export function applyFiltersAndSort() {
  const exams = getAllExams();
  
  // 记录当前列表状态，用于后续的淡入动画
  const isEmptyBefore = exams.length === 0 || processedExams.length === 0;
  
  // 记录当前排序和筛选
  const sortValue = sortSelect.value;
  const filterValue = filterSelect.value;
  const searchQuery = searchInput.value.toLowerCase().trim();
  
  // 先筛选
  let filteredExams = exams.filter(exam => {
    // 应用状态筛选
    if (filterValue !== "all") {
      const status = getExamStatus(exam.date);
      if (filterValue !== status) return false;
    }
    
    // 应用搜索查询
    if (searchQuery) {
      const searchFields = [
        exam.name || "",
        exam.subject || "",
        exam.location || "",
        exam.notes || ""
      ].map(field => field.toLowerCase());
      
      // 任何字段包含搜索词即匹配
      return searchFields.some(field => field.includes(searchQuery));
    }
    
    return true;
  });
  
  // 记录筛选后的考试数量
  const totalCount = exams.length;
  const filteredCount = filteredExams.length;
  
  // 更新筛选反馈区域
  updateFilterFeedback(searchQuery, filterValue, filteredCount, totalCount);
  
  // 再排序
  filteredExams.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    
    switch (sortValue) {
      case "date-asc":
        return dateA - dateB;
      case "date-desc":
        return dateB - dateA;
      case "name-asc":
        return (a.name || "").localeCompare(b.name || "");
      case "name-desc":
        return (b.name || "").localeCompare(a.name || "");
      default:
        return dateA - dateB;
    }
  });
  
  // 保存处理后的考试数据
  processedExams = filteredExams;
  
  // 保存用户筛选和排序偏好
  saveSortFilterPreference(sortValue, filterValue);
  
  // 渲染考试列表
  renderExamList(filteredExams, countdownList, emptyState);
  
  // 刷新倒计时计时器
  startCountdownTimer(countdownList, exams);
  
  // 如果之前是空的，现在有内容，则添加动画
  const isEmptyAfter = filteredExams.length === 0;
  if (isEmptyBefore && !isEmptyAfter) {
    animateNewExamAdded();
  }
  
  return filteredExams;
}

/**
 * 更新筛选反馈区域
 * @param {String} searchQuery - 搜索查询
 * @param {String} filterValue - 筛选值
 * @param {Number} filteredCount - 筛选后的数量
 * @param {Number} totalCount - 总数量
 */
function updateFilterFeedback(searchQuery, filterValue, filteredCount, totalCount) {
  const filterFeedback = document.getElementById("filter-feedback");
  if (!filterFeedback) return;
  
  let feedbackText = "";
  
  if (filteredCount === 0) {
    feedbackText = "未找到匹配的考试";
  } else if (searchQuery && filterValue !== "all") {
    // 既有搜索又有状态筛选
    const statusText = getFilterStatusText(filterValue);
    feedbackText = `正在显示 ${filteredCount}/${totalCount} 个${statusText}考试（搜索：${searchQuery}）`;
  } else if (searchQuery) {
    // 只有搜索
    feedbackText = `正在显示 ${filteredCount}/${totalCount} 个考试（搜索：${searchQuery}）`;
  } else if (filterValue !== "all") {
    // 只有状态筛选
    const statusText = getFilterStatusText(filterValue);
    feedbackText = `正在显示 ${filteredCount}/${totalCount} 个${statusText}考试`;
  } else {
    // 没有筛选
    feedbackText = `显示全部 ${totalCount} 个考试`;
  }
  
  filterFeedback.textContent = feedbackText;
  
  // 根据是否有筛选来添加视觉提示
  const hasFilter = searchQuery || filterValue !== "all";
  filterFeedback.classList.toggle("has-filter", hasFilter);
}

/**
 * 获取筛选状态文本
 * @param {String} filterValue - 筛选值
 * @returns {String} 状态文本
 */
function getFilterStatusText(filterValue) {
  switch (filterValue) {
    case "urgent": return "紧急";
    case "upcoming": return "即将到来";
    case "distant": return "较远";
    case "past": return "已结束";
    default: return "";
  }
}

/**
 * 新考试添加后的动画效果
 */
function animateNewExamAdded() {
  setTimeout(() => {
    const newExam = countdownList.querySelector('.countdown-item:first-child');
    if (newExam) {
      newExam.classList.add('highlight-new');
      setTimeout(() => {
        newExam.classList.remove('highlight-new');
      }, 2000);
    }
  }, 300);
}

/**
 * 保存筛选偏好
 * @param {String} sortValue - 排序值
 * @param {String} filterValue - 筛选值
 */
function saveSortFilterPreference(sortValue, filterValue) {
  try {
    localStorage.setItem("countdown_sort_preference", sortValue);
    localStorage.setItem("countdown_filter_preference", filterValue);
  } catch (e) {
    console.error("保存筛选偏好失败:", e);
  }
}

/**
 * 加载筛选偏好
 */
function loadSortFilterPreference() {
  try {
    const savedSort = localStorage.getItem("countdown_sort_preference");
    const savedFilter = localStorage.getItem("countdown_filter_preference");
    
    if (savedSort && sortSelect) {
      sortSelect.value = savedSort;
    }
    
    if (savedFilter && filterSelect) {
      // 确保'past'选项已添加
      ensurePastOptionExists();
      
      // 设置筛选值
      filterSelect.value = savedFilter;
    }
  } catch (e) {
    console.error("加载筛选偏好失败:", e);
  }
}

/**
 * 确保'past'选项存在
 */
function ensurePastOptionExists() {
  if (filterSelect) {
    let pastOptionExists = false;
    for (let i = 0; i < filterSelect.options.length; i++) {
      if (filterSelect.options[i].value === "past") {
        pastOptionExists = true;
        break;
      }
    }
    
    if (!pastOptionExists) {
      const pastOption = document.createElement("option");
      pastOption.value = "past";
      pastOption.textContent = "已结束";
      filterSelect.appendChild(pastOption);
    }
  }
}

/**
 * 验证表单输入
 * @param {HTMLElement} inputElement - 输入元素
 * @param {Function} validationFn - 验证函数，返回true表示验证通过
 * @param {String} errorMessage - 错误消息
 * @returns {Boolean} 验证是否通过
 */
function validateInput(inputElement, validationFn, errorMessage) {
  if (!inputElement) return false;
  
  const value = inputElement.value;
  const isValid = validationFn(value);
  
  if (!isValid) {
    showInputError(inputElement, errorMessage);
    return false;
  } else {
    clearInputError(inputElement);
    return true;
  }
}

/**
 * 显示输入框错误
 * @param {HTMLElement} inputElement - 输入元素
 * @param {String} message - 错误消息
 */
function showInputError(inputElement, message) {
  inputElement.classList.add("is-invalid");
  
  // 查找或创建错误消息元素
  let errorElement = inputElement.nextElementSibling;
  if (!errorElement || !errorElement.classList.contains("error-message")) {
    errorElement = document.createElement("div");
    errorElement.className = "error-message";
    inputElement.parentNode.insertBefore(errorElement, inputElement.nextSibling);
  }
  
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

/**
 * 清除输入框错误
 * @param {HTMLElement} inputElement - 输入元素
 */
function clearInputError(inputElement) {
  inputElement.classList.remove("is-invalid");
  
  // 隐藏错误消息
  const errorElement = inputElement.nextElementSibling;
  if (errorElement && errorElement.classList.contains("error-message")) {
    errorElement.style.display = "none";
  }
}

/**
 * 验证日期和时间组合是否合法（不早于当前时间）
 * @param {HTMLElement} dateInput - 日期输入元素
 * @param {HTMLElement} timeInput - 时间输入元素
 * @returns {Boolean} 验证是否通过
 */
function validateDatetime(dateInput, timeInput) {
  if (!dateInput || !timeInput) return false;
  
  const dateValue = dateInput.value;
  const timeValue = timeInput.value || "00:00";
  
  // 如果任一输入为空，不进行验证
  if (!dateValue || !timeValue) return true;
  
  const dateTime = new Date(`${dateValue}T${timeValue}`);
  const now = new Date();
  
  // 检查日期时间格式是否有效
  if (isNaN(dateTime.getTime())) {
    showInputError(dateInput, "无效的日期格式");
    return false;
  }
  
  // 检查是否为过去时间
  if (dateTime < now) {
    showInputError(dateInput, "考试日期不能早于当前时间");
    return false;
  } else {
    clearInputError(dateInput);
    return true;
  }
}

/**
 * 清除表单中所有错误状态
 */
function clearAllFormErrors() {
  const formInputs = examForm.querySelectorAll('input, textarea');
  formInputs.forEach(input => {
    clearInputError(input);
  });
}