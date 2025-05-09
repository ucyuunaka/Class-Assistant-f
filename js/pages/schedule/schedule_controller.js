// 课表主控制器
// 协调其他课表模块，提供主要接口

import { scheduleData, loadScheduleFromStorage, saveScheduleToStorage, afterCourseDataChanged } from "/js/pages/schedule/schedule_data.js"; // Updated path and combined import
import { renderTimetable, renderListView } from "/js/pages/schedule/schedule_render.js"; // Updated path
import { updateCoursesCache } from "/js/pages/schedule/schedule_cache.js"; // Updated path
import { setupDragAndDrop } from "/js/pages/schedule/schedule_drag.js"; // Updated path
import { initScheduleEvents } from "/js/pages/schedule/schedule_events.js"; // Updated path and removed duplicate export
import { showNotification } from "/components/notifications/notifications.js"; // Updated path format

/**
 * 初始化课表数据和功能
 */
export function initSchedule() {
  try {
    // 从本地存储加载数据
    const loadedFromStorage = loadScheduleFromStorage();

    // 初始化缓存
    updateCoursesCache();
    
    // 渲染界面
    renderTimetable();
    renderListView();
    
    // 初始化事件处理
    initScheduleEvents();
    
    // 初始化拖放功能（初始为非编辑模式）
    setupDragAndDrop(false);
    

    return true;
  } catch (error) {
    console.error("初始化课表数据失败:", error);
    document.getElementById("week-view-container").innerHTML = `
      <div class="alert alert-danger">
        <h4>初始化数据失败</h4>
        <p>${error.message}</p>
        <p>请检查控制台获取详细信息</p>
      </div>
    `;
    showNotification("初始化课表数据失败，请刷新页面重试", "error");
    return false;
  }
}

// 导出一些公共方法供其他调用
export { afterCourseDataChanged };