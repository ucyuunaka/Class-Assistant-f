// 考试倒计时渲染模块
import { getExamStatus, getStatusInfo, calculateCountdown, formatDate } from '/js/pages/countdown/countdown_data.js';

// 存储倒计时计时器ID
let countdownInterval = null;

/**
 * 渲染考试列表
 * @param {Array} filteredExams - 筛选后的考试数组
 * @param {HTMLElement} countdownList - 考试列表容器
 * @param {HTMLElement} emptyState - 空状态容器
 */
export function renderExamList(filteredExams, countdownList, emptyState) {
  countdownList.innerHTML = "";

  if (!filteredExams || filteredExams.length === 0) {
    emptyState.style.display = "block";
    countdownList.style.display = "none";
    return;
  }

  emptyState.style.display = "none";
  countdownList.style.display = "block";

  // 使用一个文档片段来提高渲染性能
  const fragment = document.createDocumentFragment();
  
  filteredExams.forEach((exam) => {
    const examDate = new Date(exam.date);
    const status = getExamStatus(exam.date);
    const statusInfo = getStatusInfo(status);

    const item = document.createElement("div");
    
    // 先创建元素不添加动画类，避免闪烁
    item.className = `countdown-item ${status}`;
    item.dataset.examId = exam.id;

    const countdownValues = calculateCountdown(examDate);

    const totalSpan = 60 * 24 * 60 * 60 * 1000;
    const timeRemaining = Math.max(0, examDate - new Date());
    const progressPercent = Math.max(
      0,
      Math.min(100, (1 - timeRemaining / totalSpan) * 100)
    );

    item.innerHTML = `
      <div class="status-badge ${statusInfo.class}" style="border: 1px solid ${statusInfo.borderColor}">${statusInfo.text}</div>
      <div class="countdown-main">
        <h3 class="countdown-title">${exam.name}</h3>
        <div class="countdown-details">
          <div><span class="countdown-detail-label">科目：</span>${exam.subject || "N/A"}</div>
          <div><span class="countdown-detail-label">时间：</span>${formatDate(examDate, "YYYY年MM月DD日 HH:mm")}</div>
          <div><span class="countdown-detail-label">地点：</span>${exam.location || "N/A"}</div>
          <div><span class="countdown-detail-label">备注：</span>${exam.notes || "无"}</div>
        </div>
        <div class="countdown-actions">
          <button class="btn btn-outline edit-btn" onclick="openEditExamModal(${exam.id})"><i class="fas fa-edit"></i> 编辑</button>
          <button class="btn btn-outline delete-btn" onclick="deleteExam(${exam.id})" style="color: var(--danger-color)"><i class="fas fa-trash"></i> 删除</button>
        </div>
      </div>
      <div class="countdown-display ${status === "past" ? "past-exam" : ""}">
        ${status !== "past" ? `
        <div class="countdown-label">距离考试还剩</div>
        <div class="countdown-timer">
          <div class="countdown-unit">
            <div class="countdown-value days">${countdownValues.days}</div>
            <div class="countdown-unit-label">天</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value hours">${String(countdownValues.hours).padStart(2, "0")}</div>
            <div class="countdown-unit-label">时</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value minutes">${String(countdownValues.minutes).padStart(2, "0")}</div>
            <div class="countdown-unit-label">分</div>
          </div>
          <div class="countdown-unit">
            <div class="countdown-value seconds">${String(countdownValues.seconds).padStart(2, "0")}</div>
            <div class="countdown-unit-label">秒</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        ` : `
        <div class="countdown-label">考试已结束</div>
        <div style="font-size: 2rem; color: var(--text-secondary); margin-top: 1rem;"><i class="fas fa-check-circle"></i></div>
        `}
      </div>
    `;
    
    item.style.opacity = "0";
    item.style.transform = "translateY(20px)";
    
    // 添加到文档片段中
    fragment.appendChild(item);
  });

  countdownList.appendChild(fragment);
  
  requestAnimationFrame(() => {
    // 获取所有新添加的项目
    const items = countdownList.querySelectorAll('.countdown-item');
    
    items.forEach((item, index) => {
      setTimeout(() => {
        item.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        item.style.opacity = "1";
        item.style.transform = "translateY(0)";
      }, index * 50); // 每个元素错开50ms显示
    });
  });
}

/**
 * 更新倒计时显示
 * @param {HTMLElement} countdownList - 考试列表容器
 * @param {Array} exams - 考试数据
 */
export function updateCountdowns(countdownList, exams) {
  const items = countdownList.querySelectorAll(".countdown-item");
  
  items.forEach(item => {
    const examId = parseInt(item.dataset.examId);
    const exam = exams.find(e => e.id === examId);
    if (!exam) return;
    
    const examDate = new Date(exam.date);
    const countdownValues = calculateCountdown(examDate);
    
    const daysEl = item.querySelector(".countdown-value.days");
    const hoursEl = item.querySelector(".countdown-value.hours");
    const minutesEl = item.querySelector(".countdown-value.minutes");
    const secondsEl = item.querySelector(".countdown-value.seconds");
    
    if (daysEl) daysEl.textContent = countdownValues.days;
    if (hoursEl) {
      hoursEl.textContent = String(countdownValues.hours).padStart(
        2,
        "0"
      );
    }
    if (minutesEl) {
      minutesEl.textContent = String(countdownValues.minutes).padStart(
        2,
        "0"
      );
    }
    if (secondsEl) {
      secondsEl.textContent = String(countdownValues.seconds).padStart(
        2,
        "0"
      );
    }
    
    // 更新进度条
    const progressFill = item.querySelector(".progress-fill");
    if (progressFill) {
      const totalSpan = 60 * 24 * 60 * 60 * 1000; // 约60天
      const timeRemaining = Math.max(0, examDate - new Date());
      const progressPercent = Math.max(
        0,
        Math.min(100, (1 - timeRemaining / totalSpan) * 100)
      );
      progressFill.style.width = `${progressPercent}%`;
    }
  });
}

/**
 * 启动倒计时定时器
 * @param {HTMLElement} countdownList - 考试列表容器
 * @param {Array} exams - 考试数据
 */
export function startCountdownTimer(countdownList, exams) {
  clearInterval(countdownInterval);
  updateCountdowns(countdownList, exams);
  countdownInterval = setInterval(() => updateCountdowns(countdownList, exams), 1000);
}

/**
 * 停止倒计时定时器
 */
export function stopCountdownTimer() {
  clearInterval(countdownInterval);
}

/**
 * 用动画效果过渡筛选变化
 * @param {HTMLElement} countdownList - 考试列表容器
 * @param {Function} applyFiltersAndSort - 应用筛选和排序的回调函数
 */
export function animateFilterChange(countdownList, applyFiltersAndSort) {
  // 如果有列表内容，先淡出现有内容
  if (countdownList.children.length > 0) {
    let loadingIndicator = document.querySelector('.loading-indicator');
    
    // 如果加载指示器不存在，创建一个
    if (!loadingIndicator) {
      loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'loading-indicator';
      loadingIndicator.innerHTML = '<i class="fas fa-circle-notch fa-spin fa-2x"></i><p>正在加载考试数据...</p>';
      // 将加载指示器添加到container容器而不是直接放在列表后面
      document.querySelector('.container').appendChild(loadingIndicator);
    }
    
    // 淡出当前列表项
    const items = countdownList.querySelectorAll('.countdown-item');
    const staggerDelay = Math.min(10, Math.floor(200 / items.length));
    
    items.forEach((item, i) => {
      item.style.transition = `opacity 0.2s ease ${i * staggerDelay}ms, transform 0.2s ease ${i * staggerDelay}ms`;
      item.style.opacity = "0";
      item.style.transform = "translateY(10px)";
    });
    
    // 显示加载指示器
    setTimeout(() => {
      loadingIndicator.classList.add('active');
    }, 100);
    
    // 短暂延迟后应用新的筛选
    setTimeout(() => {
      loadingIndicator.classList.remove('active');
      applyFiltersAndSort();
    }, 300);
  } else {
    applyFiltersAndSort();
  }
}