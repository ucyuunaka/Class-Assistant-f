// 课表拖放控制器
// 负责课表的拖放交互功能

import { moveCourse, scheduleData } from "/js/pages/schedule/schedule_data.js";
import { renderTimetable, renderListView, getDayName } from "/js/pages/schedule/schedule_render.js";
import { checkCanPlaceCourse, getPlacementBlockReason, updateCoursesCache, coursesCache } from "/js/pages/schedule/schedule_cache.js";

// 拖拽状态变量
let draggedItem = null;
let draggedCourseId = null;
let lastMouseOverTime = 0;
const mouseOverThrottle = 100; // 鼠标悬停事件节流间隔（毫秒）

// UI 更新队列优化
const uiUpdateQueue = {
  cells: new Map(),
  pendingUpdate: false,
  
  // 添加单元格到更新队列
  queueCellUpdate(cell, updates) {
    if (!cell) return;
    
    const cellId = cell.dataset.day + '-' + cell.dataset.time;
    let cellUpdates = this.cells.get(cell);
    
    if (!cellUpdates) {
      cellUpdates = {
        element: cell,
        classes: { add: [], remove: [] },
        tooltip: null
      };
      this.cells.set(cell, cellUpdates);
    }
    
    // 合并类名操作
    if (updates.addClass) {
      if (Array.isArray(updates.addClass)) {
        updates.addClass.forEach(cls => {
          if (!cellUpdates.classes.add.includes(cls) && !cell.classList.contains(cls)) {
            cellUpdates.classes.add.push(cls);
          }
          // 从移除列表中删除（如果存在）
          const removeIndex = cellUpdates.classes.remove.indexOf(cls);
          if (removeIndex !== -1) {
            cellUpdates.classes.remove.splice(removeIndex, 1);
          }
        });
      } else if (!cellUpdates.classes.add.includes(updates.addClass) && !cell.classList.contains(updates.addClass)) {
        cellUpdates.classes.add.push(updates.addClass);
        // 从移除列表中删除（如果存在）
        const removeIndex = cellUpdates.classes.remove.indexOf(updates.addClass);
        if (removeIndex !== -1) {
          cellUpdates.classes.remove.splice(removeIndex, 1);
        }
      }
    }
    
    if (updates.removeClass) {
      if (Array.isArray(updates.removeClass)) {
        updates.removeClass.forEach(cls => {
          if (!cellUpdates.classes.remove.includes(cls) && cell.classList.contains(cls)) {
            cellUpdates.classes.remove.push(cls);
          }
          // 从添加列表中删除（如果存在）
          const addIndex = cellUpdates.classes.add.indexOf(cls);
          if (addIndex !== -1) {
            cellUpdates.classes.add.splice(addIndex, 1);
          }
        });
      } else if (!cellUpdates.classes.remove.includes(updates.removeClass) && cell.classList.contains(updates.removeClass)) {
        cellUpdates.classes.remove.push(updates.removeClass);
        // 从添加列表中删除（如果存在）
        const addIndex = cellUpdates.classes.add.indexOf(updates.removeClass);
        if (addIndex !== -1) {
          cellUpdates.classes.add.splice(addIndex, 1);
        }
      }
    }
    
    if (updates.tooltip !== undefined) {
      cellUpdates.tooltip = updates.tooltip;
    }
    
    // 如果无挂起的更新，更新动画帧
    if (!this.pendingUpdate) {
      this.pendingUpdate = true;
      requestAnimationFrame(() => this.processUpdates());
    }
  },
  
  // 处理所有待更新
  processUpdates() {
    // 处理所有单元格更新
    for (const [cell, updates] of this.cells.entries()) {
      // 添加类名
      if (updates.classes.add.length > 0) {
        cell.classList.add(...updates.classes.add);
      }
      
      // 移除类名
      if (updates.classes.remove.length > 0) {
        cell.classList.remove(...updates.classes.remove);
      }
      
      if (updates.tooltip !== null) {
        const existingTooltip = cell.querySelector(".drag-tooltip");
        
        // 有新的提示且当前没有，或有新的提示且内容不同
        if (updates.tooltip && (!existingTooltip || existingTooltip.textContent !== updates.tooltip)) {
          if (existingTooltip) existingTooltip.remove();
          
          const tooltip = document.createElement("div");
          tooltip.className = "drag-tooltip";
          tooltip.textContent = updates.tooltip;
          cell.appendChild(tooltip);
        } 
        // 提示为空且存在当前提示，则移除
        else if (updates.tooltip === '' && existingTooltip) {
          existingTooltip.remove();
        }
      }
    }
    
    // 清空队列
    this.cells.clear();
    this.pendingUpdate = false;
  },
  
  // 清除所有单元格更新
  clearAllCellUpdates() {
    const cells = document.querySelectorAll(".timetable-cell");
    const dragClasses = ["drag-over", "drag-over-invalid", "drag-preview-valid", "drag-preview-invalid"];
    
    cells.forEach(cell => {
      cell.classList.remove(...dragClasses);
      const tooltip = cell.querySelector(".drag-tooltip");
      if (tooltip) tooltip.remove();
    });
    
    // 清空队列
    this.cells.clear();
    this.pendingUpdate = false;
  }
};

/**
 * 设置拖放功能
 * @param {boolean} isEditMode - 是否处于编辑模式
 */
export function setupDragAndDrop(isEditMode) {
  const timetableGrid = document.getElementById("timetable-grid");
  if (!timetableGrid) return;


  // 确保课程缓存是最新的，先强制更新一次缓存
  updateCoursesCache();
  
  // 打印当前课程状态，便于调试
  scheduleData.courses.forEach(course => {

  });

  const cells = timetableGrid.querySelectorAll(".timetable-cell");

  // 先清除所有单元格的拖放相关样式和提示
  cells.forEach((cell) => {
    cell.classList.remove("drag-over", "drag-over-invalid", "drag-preview-valid", "drag-preview-invalid");
    const tooltip = cell.querySelector(".drag-tooltip");
    if (tooltip) tooltip.remove();
  });

  // 先移除父容器上可能存在的事件
  timetableGrid.removeEventListener("dragstart", handleGridDragStart);
  timetableGrid.removeEventListener("dragend", handleGridDragEnd);
  timetableGrid.removeEventListener("dragover", handleGridDragOver);
  timetableGrid.removeEventListener("dragenter", handleGridDragEnter);
  timetableGrid.removeEventListener("dragleave", handleGridDragLeave);
  timetableGrid.removeEventListener("drop", handleGridDrop);
  timetableGrid.removeEventListener("mouseover", handleGridMouseOver);
  timetableGrid.removeEventListener("mouseout", handleGridMouseOut);

  if (isEditMode) {
    
    // 使用事件委托：在父容器上绑定所有拖放事件
    timetableGrid.addEventListener("dragstart", handleGridDragStart);
    timetableGrid.addEventListener("dragend", handleGridDragEnd);
    timetableGrid.addEventListener("dragover", handleGridDragOver);
    timetableGrid.addEventListener("dragenter", handleGridDragEnter);
    timetableGrid.addEventListener("dragleave", handleGridDragLeave);
    timetableGrid.addEventListener("drop", handleGridDrop);
    timetableGrid.addEventListener("mouseover", handleGridMouseOver);
    timetableGrid.addEventListener("mouseout", handleGridMouseOut);
    
    // 单独设置每个课程卡片为可拖动
    const courseCards = timetableGrid.querySelectorAll(".course-card");
    
    courseCards.forEach((card) => {
      card.setAttribute("draggable", "true");
      card.classList.add("draggable");
    });
    
    // 监听主题变化事件
    window.addEventListener('themeChanged', updateDragDropTheme);
  } else {
    // 移除课程卡片的拖动属性
    const courseCards = timetableGrid.querySelectorAll(".course-card");
    courseCards.forEach((card) => {
      card.removeAttribute("draggable");
      card.classList.remove("draggable");
    });
    
    // 移除主题变化监听
    window.removeEventListener('themeChanged', updateDragDropTheme);
  }
  
  // 样式已迁移到 css/pages/schedule.css
}

/**
 * 更新拖放主题
 */
function updateDragDropTheme() {
  const timetableGrid = document.getElementById("timetable-grid");
  if (!timetableGrid) return;
  
  const cells = timetableGrid.querySelectorAll(".timetable-cell");
  const currentTheme = document.body.getAttribute('data-theme') || 'light';
  
  if (currentTheme === 'dark') {
    requestAnimationFrame(() => {
      cells.forEach(cell => {
        if (cell.classList.contains("drag-preview-valid")) {
          cell.style.backgroundColor = "rgba(40, 167, 69, 0.2)";
        } else if (cell.classList.contains("drag-preview-invalid")) {
          cell.style.backgroundColor = "rgba(220, 53, 69, 0.2)";
        } else {
          cell.style.backgroundColor = "";
        }
      });
    });
  } else {
    requestAnimationFrame(() => {
      cells.forEach(cell => {
        cell.style.backgroundColor = "";
      });
    });
  }
}

/**
 * 显示提示信息
 * @param {HTMLElement} cell - 目标单元格
 * @param {string} message - 提示消息
 */
function showTooltip(cell, message) {
  uiUpdateQueue.queueCellUpdate(cell, { tooltip: message });
}

/**
 * 临时从缓存中移除课程单元格，用于拖动判断
 * @param {Object} course - 课程对象 
 * @returns {Map} 临时保存的单元格Map，用于后续恢复
 */
function tempRemoveCourseFromCache(course) {
  // 用于保存临时移除的格子
  const tempOccupiedCells = new Map();
  
  if (!course || !coursesCache || !coursesCache.occupiedCells) {
    return tempOccupiedCells;
  }
  
  try {
    
    // 计算课程所有占用的格子
    const startTime = course.time;
    const endTime = course.endTime || course.time;
    
    // 多格课程需要移除所有占用的格子
    for (let time = startTime; time <= endTime; time++) {
      const cellKey = `${course.day}-${time}`;
      
      // 检查该格子是否被该课程占用
      if (coursesCache.occupiedCells.has(cellKey) && 
          coursesCache.occupiedCells.get(cellKey) === course.id) {
        // 保存然后移除
        tempOccupiedCells.set(cellKey, course.id);
        coursesCache.occupiedCells.delete(cellKey);
      } else if (coursesCache.occupiedCells.has(cellKey)) {
        const otherId = coursesCache.occupiedCells.get(cellKey);
        console.warn(`单元格 [${cellKey}] 被另一个课程占用 (ID:${otherId})`);
      } else {
        console.warn(`单元格 [${cellKey}] 不在占用缓存中`);
      }
    }
  } catch (error) {
    console.error("临时移除课程单元格时出错:", error);
  }
  
  return tempOccupiedCells;
}

/**
 * 恢复临时移除的课程单元格
 * @param {Map} tempCells - 临时保存的单元格Map 
 */
function restoreTempRemovedCells(tempCells) {
  if (!tempCells || !coursesCache || !coursesCache.occupiedCells) {
    return;
  }
  
  try {
    // 恢复所有临时移除的格子
    for (const [key, id] of tempCells) {
      coursesCache.occupiedCells.set(key, id);
      console.debug(`恢复单元格 [${key}]`);
    }
  } catch (error) {
    console.error("恢复临时移除的单元格时出错:", error);
  }
}

/**
 * 更新所有单元格的预览效果
 * @param {string} courseId - 拖动的课程ID
 */
function updateAllCellsPreview(courseId) {
  if (!courseId) return;
  
  
  try {
    // 确保课程缓存是最新的
    updateCoursesCache();
    
    // 获取被拖动的课程信息
    const draggedCourse = scheduleData.courses.find(c => c.id === parseInt(courseId));
    if (!draggedCourse) {
      console.error(`找不到ID为${courseId}的课程`);
      return;
    }
    
    const duration = draggedCourse.endTime - draggedCourse.startTime + 1;
    
    // 临时从缓存中移除当前课程所占用的格子
    const tempOccupiedCells = tempRemoveCourseFromCache(draggedCourse);
    
    const cells = document.querySelectorAll(".timetable-cell");
    const updates = [];
    
    // 收集所有需要更新的单元格
    cells.forEach(cell => {
      try {
        const day = parseInt(cell.dataset.day);
        const time = parseInt(cell.dataset.time);
        
        // 不显示在空白单元格上
        if (!day || !time) return;
        
        // 检查该位置是否可以放置课程
        let canPlace = false;
        try {
          canPlace = checkCanPlaceCourse(courseId, day, time);
        } catch (error) {
          console.error("检查格子可放置性出错:", error);
        }
        
        // 重置单元格状态
        delete cell.dataset.dragState;
        delete cell.dataset.previewState;
        
        // 添加到更新列表
        updates.push({
          cell,
          canPlace,
          day,
          time
        });
      } catch (cellError) {
        console.error("处理单元格时出错:", cellError);
      }
    });
    
    // 恢复临时移除的格子
    restoreTempRemovedCells(tempOccupiedCells);
    
    
    // requestAnimationFrame 批量更新 UI
    requestAnimationFrame(() => {
      updates.forEach(update => {
        try {
          // 记录新的预览状态
          update.cell.dataset.previewState = update.canPlace ? 'valid' : 'invalid';
          
          // 移除所有之前的样式类
          update.cell.classList.remove(
            "drag-preview-valid", 
            "drag-preview-invalid", 
            "drag-over", 
            "drag-over-invalid",
            "preview-pulse-animation",
            "preview-error-animation",
            "drag-enter-animation",
            "drag-enter-error-animation"
          );
          
          if (update.canPlace) {
            update.cell.classList.add("drag-preview-valid");
          } else {
            update.cell.classList.add("drag-preview-invalid");
          }
          
          const tooltip = update.cell.querySelector(".drag-tooltip");
          if (tooltip) tooltip.remove();
        } catch (updateError) {
          console.error("更新单元格UI时出错:", updateError);
        }
      });
    });
  } catch (error) {
    console.error("更新格子预览效果出错:", error);
  }
}

/**
 * 处理拖动开始事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDragStart(e) {
  const card = e.target.closest(".course-card");
  if (!card) return;
  
  draggedItem = card;
  draggedCourseId = card.getAttribute("data-course-id");
  
  // 添加拖动中的样式类
  setTimeout(() => {
    card.classList.add("dragging");
    card.style.opacity = "0.5"; // 使拖动项半透明
  }, 0);
  
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", draggedCourseId); // 传递课程ID
  
  // 预先为所有单元格添加预览效果
  updateAllCellsPreview(draggedCourseId);
  
  // 获取课程名称用于拖动提示
  const courseName = card.querySelector(".course-title").textContent;
  if (courseName) {
    // 添加拖动提示效果
    document.body.setAttribute('data-dragging-course', courseName);
  }
}

/**
 * 处理拖动结束事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDragEnd(e) {
  const card = e.target.closest(".course-card");
  if (!card) return;
  
  // 使用统一的状态重置函数清理所有状态
  resetDragState();
}

/**
 * 处理拖动经过事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDragOver(e) {
  const cell = e.target.closest(".timetable-cell");
  if (!cell) return;
  
  e.preventDefault(); // 必须阻止默认行为以允许drop
  e.dataTransfer.dropEffect = "move";
}

/**
 * 处理拖动进入事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDragEnter(e) {
  try {
    const cell = e.target.closest(".timetable-cell");
    if (!cell || !draggedCourseId) return;
    
    e.preventDefault();
    
    const day = parseInt(cell.dataset.day);
    const time = parseInt(cell.dataset.time);
    
    // 获取被拖动的课程信息
    const draggedCourse = scheduleData.courses.find(c => c.id === parseInt(draggedCourseId));
    if (!draggedCourse) return;
    
    // 临时从缓存中移除当前课程所占用的格子
    const tempOccupiedCells = tempRemoveCourseFromCache(draggedCourse);
    
    // 检查该位置是否可以放置课程
    let canPlace = false;
    try {
      canPlace = checkCanPlaceCourse(draggedCourseId, day, time);
    } catch (error) {
      console.error("检查格子可放置性出错:", error);
    }
    
    // 恢复临时移除的格子
    restoreTempRemovedCells(tempOccupiedCells);
    
    // 获取当前单元格状态
    const currentState = cell.dataset.dragState || '';
    const newState = canPlace ? 'valid' : 'invalid';
    
    // 如果状态没变，不做更新
    if (currentState === newState) return;
    
    // 记录新状态
    cell.dataset.dragState = newState;
    
    // 使用更新队列批量更新UI
    uiUpdateQueue.queueCellUpdate(cell, {
      removeClass: ["drag-over", "drag-over-invalid", "drag-enter-animation", "drag-enter-error-animation"],
      addClass: canPlace ? ["drag-over", "drag-enter-animation"] : ["drag-over-invalid", "drag-enter-error-animation"],
      tooltip: canPlace ? "可以放置课程" : "无法放置课程：时段冲突或超出范围"
    });
  } catch (error) {
    console.error("处理拖动进入事件时出错:", error);
  }
}

/**
 * 处理拖动离开事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDragLeave(e) {
  const cell = e.target.closest(".timetable-cell");
  if (!cell) return;
  
  // 检查是否真的离开了单元格（可能只是进入了单元格的子元素）
  const relatedTarget = e.relatedTarget;
  if (cell.contains(relatedTarget)) return;
  
  // 清除状态标记
  delete cell.dataset.dragState;
  
  // 使用更新队列批量更新UI
  uiUpdateQueue.queueCellUpdate(cell, {
    removeClass: ["drag-over", "drag-over-invalid", "drag-enter-animation", "drag-enter-error-animation"],
    tooltip: ''
  });
}

/**
 * 处理放置事件
 * @param {Event} e - 拖动事件对象
 */
function handleGridDrop(e) {
  try {
    const cell = e.target.closest(".timetable-cell");
    if (!cell) return;
    
    e.preventDefault();
    
    // 清除状态标记
    delete cell.dataset.dragState;
    
    // 使用更新队列批量清除UI
    uiUpdateQueue.queueCellUpdate(cell, {
      removeClass: ["drag-over", "drag-over-invalid", "drag-preview-valid", "drag-preview-invalid"],
      tooltip: ''
    });
    
    if (!draggedItem) return;
    
    const courseId = e.dataTransfer.getData("text/plain");
    const targetDay = parseInt(cell.dataset.day);
    const targetTime = parseInt(cell.dataset.time);
    
    // 获取被拖动的课程信息
    const draggedCourse = scheduleData.courses.find(c => c.id === parseInt(courseId));
    if (!draggedCourse) {
      console.error(`找不到ID为${courseId}的课程`);
      // 确保清理拖动状态
      resetDragState();
      return;
    }
    
    // 临时从缓存中移除当前课程所占用的格子
    const tempOccupiedCells = tempRemoveCourseFromCache(draggedCourse);
    
    // 检查该位置是否可以放置课程
    let canPlace = false;
    try {
      canPlace = checkCanPlaceCourse(courseId, targetDay, targetTime);
    } catch (error) {
      console.error("检查格子可放置性出错:", error);
    }
    
    // 恢复临时移除的格子
    restoreTempRemovedCells(tempOccupiedCells);
    
    // 如果不能放置，显示原因并返回
    if (!canPlace) {
      try {
        const reason = getPlacementBlockReason(courseId, targetDay, targetTime);
        window.showNotification(reason, "error");
      } catch (error) {
        console.error("获取放置阻止原因出错:", error);
        window.showNotification("无法放置课程", "error");
      }
      
      // 恢复拖动项的不透明度，因为拖放失败
      if (draggedItem) {
        draggedItem.style.opacity = "1";
      }
      
      // （32）确保清理拖动状态并更新缓存
      resetDragState();
      updateCoursesCache();
      return;
    }
    
    try {
      // 保存课程的原始信息，用于恢复
      const originalDay = draggedCourse.day;
      const originalStartTime = draggedCourse.time;
      const originalEndTime = draggedCourse.endTime;
      
      // 计算课程时长
      const courseDuration = originalEndTime ? (originalEndTime - originalStartTime + 1) : 1;
      
      // 调用移动课程的函数
      const success = moveCourse(courseId, targetDay, targetTime);      
      if (success) {
        // 移动成功后，如果是跨时间段课程，需要更新endTime保持持续时间不变
        if (courseDuration > 1) {
          const updatedCourse = scheduleData.courses.find(c => c.id === parseInt(courseId));
          if (updatedCourse) {
            // 确保endTime与原课程时长一致
            updatedCourse.endTime = targetTime + courseDuration - 1;
          }
        }
        
        // 移动成功后首先更新课程缓存，确保占用格子的信息是最新的
        updateCoursesCache();
        
        // 然后重新渲染课表
        renderTimetable();
        renderListView();
        
        // 重新设置拖放功能
        setupDragAndDrop(true);
        
        // 显示成功消息
        window.showNotification("课程已移动", "success");
      } else {
        // 移动失败，显示具体原因
        try {
          const reason = getPlacementBlockReason(courseId, targetDay, targetTime);
          window.showNotification("移动课程失败: " + reason, "error");
        } catch (error) {
          console.error("获取放置阻止原因出错:", error);
          window.showNotification("移动课程失败", "error");
        }
      }
    } catch (error) {
      console.error("移动课程时出错:", error);
      window.showNotification("移动课程时出错: " + error.message, "error");
    } finally {
      // 无论成功或失败，确保清理拖动状态并更新缓存
      resetDragState();
      updateCoursesCache();
    }
  } catch (error) {
    console.error("处理放置事件时出错:", error);
    // 确保在任何错误情况下都清理拖动状态并更新缓存
    resetDragState();
    updateCoursesCache();
  }
}

/**
 * 重置所有拖动状态
 * 确保在操作结束后清理所有状态
 */
function resetDragState() {
  // 恢复拖动项的不透明度
  if (draggedItem) {
    draggedItem.style.opacity = "1";
    draggedItem.classList.remove("dragging");
  }
  
  // 清除拖动引用
  draggedItem = null;
  draggedCourseId = null;
  
  // 清除UI效果
  uiUpdateQueue.clearAllCellUpdates();
  
  // 移除拖动提示
  document.body.removeAttribute('data-dragging-course');
  
}

/**
 * 处理鼠标悬停事件
 * @param {Event} e - 鼠标事件对象
 */
function handleGridMouseOver(e) {
  try {
    const cell = e.target.closest(".timetable-cell");
    if (!cell || !draggedCourseId) return;
    
    // 获取当前时间戳
    const now = Date.now();
    
    // 如果距离上次更新未达到节流间隔，则跳过
    if (now - lastMouseOverTime < mouseOverThrottle) return;
    
    // 更新上次处理时间
    lastMouseOverTime = now;
    
    const day = parseInt(cell.dataset.day);
    const time = parseInt(cell.dataset.time);
    
    // 不显示在无效单元格上的提示
    if (!day || !time) return;
    
    // 获取当前拖动的课程
    const draggedCourse = scheduleData.courses.find(c => c.id === parseInt(draggedCourseId));
    if (!draggedCourse) return;
    
    
    // 临时从缓存中移除当前课程所占用的格子
    const tempOccupiedCells = tempRemoveCourseFromCache(draggedCourse);
    
    // 检查该位置是否可以放置课程
    let canPlace = false;
    try {
      
      // 检查格子是否被占用
      if (coursesCache.occupiedCells.has(`${day}-${time}`)) {
        const occupyId = coursesCache.occupiedCells.get(`${day}-${time}`);
        const occupyCourse = scheduleData.courses.find(c => c.id === occupyId);
      }
      
      canPlace = checkCanPlaceCourse(draggedCourseId, day, time);
    } catch (error) {
      console.error("检查格子可放置性出错:", error);
    }
    
    // 恢复临时移除的格子
    restoreTempRemovedCells(tempOccupiedCells);
    
    // 获取当前单元格预览状态
    const currentPreview = cell.dataset.previewState || '';
    const newPreview = canPlace ? 'valid' : 'invalid';
    
    // 如果预览状态没变，不做更新
    if (currentPreview === newPreview) return;
    
    // 记录新的预览状态
    cell.dataset.previewState = newPreview;
    
    // 使用更新队列批量更新UI
    uiUpdateQueue.queueCellUpdate(cell, {
      removeClass: ["drag-preview-valid", "drag-preview-invalid", "preview-pulse-animation", "preview-error-animation"],
      addClass: canPlace ? ["drag-preview-valid", "preview-pulse-animation"] : ["drag-preview-invalid", "preview-error-animation"]
    });
    
    // 显示拖放提示信息
    try {
      if (canPlace) {
        const dayName = getDayName(day);
        showTooltip(cell, `可以放置「${draggedCourse.title}」到 ${dayName} 第${time}节`);
      } else {
        // 获取更具体的不可放置原因
        const reason = getPlacementBlockReason(draggedCourseId, day, time);
        showTooltip(cell, reason);
      }
    } catch (tooltipError) {
      console.error("显示提示信息时出错:", tooltipError);
    }
  } catch (error) {
    console.error("处理鼠标悬停事件时出错:", error);
  }
}

/**
 * 处理鼠标离开事件
 * @param {Event} e - 鼠标事件对象
 */
function handleGridMouseOut(e) {
  // 【备用】鼠标离开拖动相关处理可以添加在这里
}

// 导出函数以供其他模块使用
export { uiUpdateQueue };