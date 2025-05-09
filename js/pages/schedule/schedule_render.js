// 课表渲染控制器
// 负责处理课表的各种视图渲染、UI显示

import { scheduleData } from "/js/pages/schedule/schedule_data.js"; // Updated path

/**
 * 渲染周视图课表
 */
export function renderTimetable() {
  const timetableGrid = document.getElementById("timetable-grid");
  if (!timetableGrid) return;

  // 保存当前滚动位置
  const scrollTop = timetableGrid.scrollTop;
  const scrollLeft = timetableGrid.scrollLeft;

  // 清空现有内容
  timetableGrid.innerHTML = "";

  timetableGrid.appendChild(createHeader());

  // 创建一个数组保存已渲染的课程ID，避免重复渲染
  const renderedCourses = new Set();
  
  // 记录每个单元格的DOM引用，方便后续处理跨时间段课程
  const cellsMap = {};

  // 添加时间行和课程单元格
  scheduleData.timePeriods.forEach((period) => {
    // 添加时间单元格
    const timeCell = document.createElement("div");
    timeCell.className = "timetable-time";
    timeCell.textContent = period.time;
    timetableGrid.appendChild(timeCell);

    // 为每一天添加课程单元格
    for (let dayId = 1; dayId <= 7; dayId++) {
      const cell = document.createElement("div");
      cell.className = "timetable-cell";
      cell.setAttribute("data-day", dayId);
      cell.setAttribute("data-time", period.id);
      timetableGrid.appendChild(cell);
      
      // 保存单元格引用
      if (!cellsMap[dayId]) {
        cellsMap[dayId] = {};
      }
      cellsMap[dayId][period.id] = cell;
    }
  });
  
  // 第二遍扫描，处理跨时间段的课程
  scheduleData.courses.forEach((course) => {
    // 如果已经渲染过该课程，跳过
    if (renderedCourses.has(course.id)) {
      return;
    }
    
    const dayId = course.day;
    const startTime = course.time;
    
    // 获取起始单元格
    const startCell = cellsMap[dayId] && cellsMap[dayId][startTime];
    if (!startCell) return;
    
    // 标记课程已渲染
    renderedCourses.add(course.id);
    
    // 如果是跨时间段的课程
    if (course.endTime && course.endTime > course.time) {
      // 为起始单元格添加多时间段标记
      startCell.classList.add('multi-slot-course');
      
      // 创建课程卡片
      const card = createCourseCard(course, false, false);
      startCell.appendChild(card);
      
      // 计算卡片应该的高度
      const slotCount = course.endTime - course.time + 1;
      const cellHeight = 80; // 与CSS中的grid-auto-rows一致
      
      // 设置卡片高度，恢复原有的样式
      card.style.height = `${cellHeight * slotCount - 8}px`; // 减去8px作为间隔
      card.style.top = '0'; // 恢复原有的定位
      card.style.left = '0';
      card.style.right = '0';
      
      // 标记被占用的单元格，但不使用透明效果
      for (let i = course.time + 1; i <= course.endTime; i++) {
        if (cellsMap[dayId] && cellsMap[dayId][i]) {
          const occupiedCell = cellsMap[dayId][i];
          occupiedCell.classList.add('occupied-cell');
        }
      }
    } else {
      // 单时间段课程正常渲染
      startCell.appendChild(createCourseCard(course, false, false));
    }
  });

  // 恢复滚动位置
  timetableGrid.scrollTop = scrollTop;
  timetableGrid.scrollLeft = scrollLeft;
}

/**
 * 创建表头
 * @returns {DocumentFragment} 表头DOM片段
 */
function createHeader() {
  const headerFragment = document.createDocumentFragment();

  // 时间表头
  const timeHeader = document.createElement("div");
  timeHeader.className = "timetable-header";
  timeHeader.textContent = "时间";
  headerFragment.appendChild(timeHeader);

  // 星期表头
  scheduleData.days.forEach((day) => {
    const dayHeader = document.createElement("div");
    dayHeader.className = "timetable-header";
    dayHeader.textContent = day.name;
    headerFragment.appendChild(dayHeader);
  });

  return headerFragment;
}

/**
 * 创建课程卡片
 * @param {Object} course - 课程数据
 * @param {boolean} isNew - 是否新添加的课程
 * @param {boolean} isUpdated - 是否更新的课程
 * @returns {HTMLElement} 课程卡片元素
 */
export function createCourseCard(course, isNew = false, isUpdated = false) {
  const card = document.createElement("div");
  card.className = `course-card ${course.color}`;
  card.setAttribute("data-course-id", course.id);

  // 添加动画类
  if (isNew) {
    card.classList.add("added");
  } else if (isUpdated) {
    card.classList.add("updated");
  }

  // 添加删除图标（初始隐藏）
  const deleteIcon = document.createElement("div");
  deleteIcon.className = "course-delete-icon";
  deleteIcon.innerHTML = '<i class="fas fa-times"></i>';

  // 创建课程标题元素
  const titleElement = document.createElement("div");
  titleElement.className = "course-title";
  titleElement.textContent = course.title;

  // 创建教师信息元素
  const teacherElement = document.createElement("div");
  teacherElement.className = "course-info";
  teacherElement.textContent = course.teacher;

  // 创建位置信息元素
  const locationElement = document.createElement("div");
  locationElement.className = "course-location";

  // 添加位置图标
  const locationIcon = document.createElement("i");
  locationIcon.className = "fas fa-map-marker-alt";
  locationElement.appendChild(locationIcon);

  // 添加位置文本
  locationElement.appendChild(
    document.createTextNode(" " + course.location)
  );

  // 按顺序将所有元素添加到卡片中
  card.appendChild(deleteIcon);
  card.appendChild(titleElement);
  card.appendChild(teacherElement);
  card.appendChild(locationElement);

  // 添加字体自适应逻辑
  adjustFontSize(card);

  return card;
}

/**
 * 根据内容自动调整字体大小
 * @param {HTMLElement} card - 课程卡片元素
 */
function adjustFontSize(card) {
  const titleElement = card.querySelector(".course-title");
  const infoElements = card.querySelectorAll(".course-info");
  const locationElement = card.querySelector(".course-location");

  const minFontSize = 0.6;
  const baseTitleSize = 1.05;
  const baseInfoSize = 0.8;

  try {
    // 调整课程名称字体大小 - 始终应用自适应缩放
    if (titleElement) {
      const titleLength = titleElement.textContent.length;

      // 课程名称自适应算法 - 根据字符数缩放
      let scaleFactor = 1;
      if (titleLength > 4) {
        scaleFactor = Math.min(1, 4 / titleLength + 0.1);
      }

      const newSize = Math.max(
        minFontSize,
        baseTitleSize * scaleFactor
      );
      titleElement.style.fontSize = `${newSize}rem`;
    }

    // 调整教师信息字体大小 - 自适应缩放
    infoElements.forEach((element) => {
      if (element) {
        const textLength = element.textContent.length;
        let scaleFactor = 1;

        if (textLength > 6) {
          scaleFactor = Math.min(1, 6 / textLength + 0.15);
        }

        const newSize = Math.max(
          minFontSize,
          baseInfoSize * scaleFactor
        );
        element.style.fontSize = `${newSize}rem`;
      }
    });

    // 调整位置信息字体大小 - 自适应缩放
    if (locationElement) {
      const locationText = locationElement.textContent.trim();
      const textLength = locationText.length;
      let scaleFactor = 1;

      if (textLength > 6) {
        scaleFactor = Math.min(1, 6 / textLength + 0.15);
      }

      const newSize = Math.max(minFontSize, baseInfoSize * scaleFactor);
      locationElement.style.fontSize = `${newSize}rem`;

      // 确保图标与文字对齐且大小协调
      const icon = locationElement.querySelector("i");
      if (icon) {
        icon.style.fontSize = `${newSize}rem`;
      }
    }
  } catch (e) {
    console.error("调整字体大小发生错误:", e);
  }
}

/**
 * 渲染列表视图
 */
export function renderListView() {
  const listContainer = document.getElementById("list-view-container");
  if (!listContainer) return;

  const scrollTop = listContainer.scrollTop;
  listContainer.innerHTML = "";

  // 按天组织课程
  const coursesByDay = {};
  scheduleData.days.forEach((day) => {
    coursesByDay[day.id] = [];
  });

  scheduleData.courses.forEach((course) => {
    if (coursesByDay[course.day]) {
      coursesByDay[course.day].push(course);
    }
  });

  // 为每一天创建卡片
  scheduleData.days.forEach((day) => {
    // 创建该天的卡片
    const dayCard = document.createElement("div");
    dayCard.className = day.id === 1 ? "card" : "card mt-4";

    // 添加标题
    const dayTitle = document.createElement("h3");
    dayTitle.className = "mb-3";
    dayTitle.textContent = day.name;
    dayCard.appendChild(dayTitle);
    
    // 如果该天没有课程，显示"此日无课"信息
    if (coursesByDay[day.id].length === 0) {
      const noCourseInfo = document.createElement("div");
      noCourseInfo.className = "no-course-info";
      noCourseInfo.innerHTML = '<i class="fas fa-coffee"></i> 此日无课';
      noCourseInfo.style.textAlign = "center";
      noCourseInfo.style.padding = "20px";
      noCourseInfo.style.color = "var(--text-secondary)";
      noCourseInfo.style.fontSize = "1.1rem";
      dayCard.appendChild(noCourseInfo);
      listContainer.appendChild(dayCard);
      return;
    }

    // 添加该天的课程
    coursesByDay[day.id]
      .sort((a, b) => a.time - b.time)
      .forEach((course) => {
        const courseWrapper = document.createElement("div");
        courseWrapper.className = "mb-3";

        const timeRange = getTimeRangeText(course);
        const courseCard = document.createElement("div");
        courseCard.className = `course-card ${course.color}`;
        courseCard.setAttribute("data-course-id", course.id);

        // 添加删除图标（初始隐藏）
        const deleteIcon = document.createElement("div");
        deleteIcon.className = "course-delete-icon";
        deleteIcon.innerHTML = '<i class="fas fa-times"></i>';
        courseCard.appendChild(deleteIcon);

        courseCard.innerHTML += `
        <div class="course-title">${course.title}</div>
        <div class="course-info">${course.teacher}</div>
        <div class="course-info">${timeRange}</div>
        <div class="course-location">
          <i class="fas fa-map-marker-alt"></i> ${course.location}
        </div>
      `;

        courseWrapper.appendChild(courseCard);
        dayCard.appendChild(courseWrapper);
      });

    listContainer.appendChild(dayCard);
  });

  listContainer.scrollTop = scrollTop;
}

/**
 * 获取课程时间范围文本
 * @param {Object} course - 课程数据
 * @returns {string} 时间范围文本，如 "08:00-09:40"
 */
function getTimeRangeText(course) {
  if (scheduleData.timePeriods && scheduleData.timePeriods.length > 0) {
    // 获取开始时间
    const startPeriod = scheduleData.timePeriods.find(
      (period) => period.id === course.time
    );
    
    // 如果课程跨越多个时间段
    if (course.endTime && course.endTime > course.time) {
      const endPeriod = scheduleData.timePeriods.find(
        (period) => period.id === course.endTime
      );
      
      if (startPeriod && endPeriod) {
        // 提取开始和结束时间
        const startTime = startPeriod.time.split('-')[0];
        const endTime = endPeriod.time.split('-')[1];
        return `${startTime}-${endTime}`;
      }
    }

    if (startPeriod) {
      return startPeriod.time;
    }
  }

  // 如果有结束时间，显示时间范围
  if (course.endTime && course.endTime > course.time) {
    return `第${course.time}-${course.endTime}节`;
  }
  
  return `第${course.time}节`;
}

/**
 * 获取星期名称
 * @param {number} day - 星期索引(1-7)
 * @returns {string} 星期名称
 */
export function getDayName(day) {
  const dayNames = ["", "周一", "周二", "周三", "周四", "周五", "周六", "周日"];
  return dayNames[day] || `星期${day}`;
}