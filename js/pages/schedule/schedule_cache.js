// 课表缓存控制器
// 用于优化课表性能，通过缓存常用数据避免重复计算

import { scheduleData } from "/js/pages/schedule/schedule_data.js";

// 课程缓存数据结构
const coursesCache = {
  byDay: new Map(), // 按天分组的课程
  occupiedCells: new Map(), // 存储被占用的单元格 - 格式: "day-time" -> courseId
};

/**
 * （调试）验证缓存中的单元格占用情况，以确保课程真正占用了正确的格子
 */
function validateCacheOccupation() {
  let issues = 0;
  const seen = new Set(); // 检测重复占用
  
  // 首先检查所有课程声明的占用格子
  for (const course of scheduleData.courses) {
    // 计算课程占用的所有格子
    const startTime = course.time;
    const endTime = course.endTime || course.time;
    
    for (let time = startTime; time <= endTime; time++) {
      const cellKey = `${course.day}-${time}`;
      
      // （调试）检查这个格子在缓存中是否被同一课程占用
      if (!coursesCache.occupiedCells.has(cellKey)) {
        console.error(`缓存验证失败: 单元格 [${cellKey}] 应被课程 "${course.title}" (ID:${course.id}) 占用，但未在缓存中找到`);
        issues++;
      } else {
        const occupyingId = coursesCache.occupiedCells.get(cellKey);
        if (occupyingId !== course.id) {
          console.error(`缓存验证失败: 单元格 [${cellKey}] 应被课程 "${course.title}" (ID:${course.id}) 占用，但实际被课程 ID:${occupyingId} 占用`);
          issues++;
        }
      }
      
      // （调试）检查重复占用
      if (seen.has(cellKey)) {
        console.error(`重复占用检测: 单元格 [${cellKey}] 被多个课程声明占用`);
        issues++;
      }
      seen.add(cellKey);
    }
  }
  
  // 检查缓存中的每个格子是否有对应课程
  for (const [cellKey, courseId] of coursesCache.occupiedCells.entries()) {
    const course = scheduleData.courses.find(c => c.id === courseId);
    if (!course) {
      console.error(`缓存验证失败: 单元格 [${cellKey}] 被不存在的课程 ID:${courseId} 占用`);
      issues++;
      continue;
    }
    
    // 检查格子是否真的是课程声明的位置
    const [dayStr, timeStr] = cellKey.split('-');
    const day = parseInt(dayStr);
    const time = parseInt(timeStr);
    
    const startTime = course.time;
    const endTime = course.endTime || course.time;
    
    if (day !== course.day || time < startTime || time > endTime) {
      console.error(`缓存验证失败: 单元格 [${cellKey}] 被课程 "${course.title}" (ID:${course.id}) 占用，但不在课程声明的位置范围 [${course.day}-${startTime}到${endTime}]`);
      issues++;
    }
  }
  
  if (issues > 0) {
    console.error(`缓存验证发现 ${issues} 个问题`);
  } else {
  }
  
  return issues === 0;
}

/**
 * 更新课程缓存
 * 重新计算和分组课程信息
 */
export function updateCoursesCache() {
  try {
    const startTime = performance.now();
    
    // 重置缓存
    coursesCache.byDay.clear();
    coursesCache.occupiedCells.clear();
    
    // 初始化每天的空数组
    for (let i = 1; i <= 7; i++) {
      coursesCache.byDay.set(i, []);
    }
    
    // 课程计数
    let courseCount = 0;
    let cellsCount = 0;
    
    // 遍历每门课程，预计算信息并分组
    scheduleData.courses.forEach(course => {
      courseCount++;
      
      // 验证课程数据完整性
      if (!course.id || !course.day || !course.time) {
        return; // 跳过
      }
      
      // 将课程添加到对应天的数组
      if (coursesCache.byDay.has(course.day)) {
        coursesCache.byDay.get(course.day).push(course);
      }
      
      // 处理跨时间段课程，标记所有占用的单元格
      const startTime = course.time;
      const endTime = course.endTime || course.time;
      
      for (let time = startTime; time <= endTime; time++) {
        const cellKey = `${course.day}-${time}`;
        
        // 检查这个格子是否已经被其他课程占用
        if (coursesCache.occupiedCells.has(cellKey)) {
          const existingId = coursesCache.occupiedCells.get(cellKey);
          if (existingId !== course.id) {
            const existingCourse = scheduleData.courses.find(c => c.id === existingId);
            // console.warn(`单元格冲突: [${cellKey}] 已被课程 "${existingCourse ? existingCourse.title : '未知'}" (ID:${existingId}) 占用，现尝试被 "${course.title}" (ID:${course.id}) 占用`);
          }
        }
        
        // 设置占用
        coursesCache.occupiedCells.set(cellKey, course.id);
        cellsCount++;
        
        if (time === startTime) {
          console.debug(`课程 "${course.title}"(ID:${course.id}) 占用单元格 [${cellKey}]${endTime > startTime ? ' (跨时间段课程起始格)' : ''}`);
        } else {
          console.debug(`课程 "${course.title}"(ID:${course.id}) 额外占用单元格 [${cellKey}] (跨时间段课程的一部分)`);
        }
      }
    });
    
    // 验证缓存
    validateCacheOccupation();
    
    // 计算执行时间
    const endTime = performance.now();
    const executionTime = (endTime - startTime).toFixed(2);
    
    return true;
  } catch (error) {
    console.error("更新课程缓存时出错:", error);
    return false;
  }
}

/**
 * 检查单元格是否被占用
 * @param {number} day - 星期几
 * @param {number} time - 第几节课
 * @param {number} excludeCourseId - 排除的课程ID（通常是被拖动的课程）
 * @returns {boolean} 是否被占用
 */
function isCellOccupied(day, time, excludeCourseId) {
  if (!day || !time) {
    // console.warn(`检查无效的单元格: 日期=${day}, 时间=${time}`);
    return true; // 无效单元格视为被占用
  }
  
  // 生成单元格键
  const cellKey = `${day}-${time}`;
  
  // 获取占用此单元格的课程ID
  const occupyingCourseId = coursesCache.occupiedCells.get(cellKey);
  
  // 判断单元格是否被占用
  const isOccupied = occupyingCourseId !== undefined && occupyingCourseId !== excludeCourseId;
  
  // 打印调试信息（级别：调试）
  if (isOccupied) {
    const occupyingCourse = scheduleData.courses.find(c => c.id === occupyingCourseId);
    const courseName = occupyingCourse ? occupyingCourse.title : "未知课程";
    console.debug(`单元格 [${day}-${time}] 被课程 "${courseName}" (ID:${occupyingCourseId}) 占用`);
  }
  
  return isOccupied;
}

/**
 * 检查是否可以放置课程到指定格子
 * @param {number} courseId - 课程ID
 * @param {number} targetDay - 目标日期
 * @param {number} targetTime - 目标时间
 * @returns {boolean} 是否可以放置
 */
export function checkCanPlaceCourse(courseId, targetDay, targetTime) {
  if (!courseId || !targetDay || !targetTime) {
    return false;
  }
  
  courseId = parseInt(courseId);
  
  // 获取当前课程信息
  const course = scheduleData.courses.find(c => c.id === courseId);
  if (!course) {
    return false;
  }

  // 计算课程时长（节数）
  const courseDuration = course.endTime ? (course.endTime - course.time + 1) : 1;
  
  // 检查时间是否超出范围
  if (targetTime + courseDuration - 1 > scheduleData.timePeriods.length) {
    return false;
  }
  
  // 检查所有需要占用的格子是否都可用
  for (let t = targetTime; t < targetTime + courseDuration; t++) {
    if (isCellOccupied(targetDay, t, courseId)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 获取课程放置失败的具体原因
 * @param {number} courseId - 课程ID
 * @param {number} targetDay - 目标日期
 * @param {number} targetTime - 目标时间
 * @returns {string} 不可放置的原因
 */
export function getMoveCourseFailReason(courseId, targetDay, targetTime) {
  if (!courseId || !targetDay || !targetTime) {
    return "参数无效";
  }
  
  courseId = parseInt(courseId);
  
  // 获取当前课程信息
  const course = scheduleData.courses.find(c => c.id === courseId);
  if (!course) {
    return "找不到课程";
  }
  
  // 计算课程时长（节数）
  const courseDuration = course.endTime ? (course.endTime - course.time + 1) : 1;
  
  // 检查时间是否超出范围
  if (targetTime + courseDuration - 1 > scheduleData.timePeriods.length) {
    return `课程总时长超出课表范围，该课程需要连续${courseDuration}节课`;
  }
  
  // 检查每个格子的占用情况
  for (let t = targetTime; t < targetTime + courseDuration; t++) {
    const cellKey = `${targetDay}-${t}`;
    const occupyingCourseId = coursesCache.occupiedCells.get(cellKey);
    
    if (occupyingCourseId !== undefined && occupyingCourseId !== courseId) {
      const conflictCourse = scheduleData.courses.find(c => c.id === occupyingCourseId);
      if (conflictCourse) {
        return `第${t}节与课程「${conflictCourse.title}」时间冲突`;
      }
    }
  }
  
  return "未知原因";
}

/**
 * 获取更详细的不可放置原因
 * @param {number} courseId - 课程ID
 * @param {number} targetDay - 目标日期
 * @param {number} targetTime - 目标时间
 * @returns {string} 不可放置的详细原因
 */
export function getPlacementBlockReason(courseId, targetDay, targetTime) {
  if (!courseId || !targetDay || !targetTime) {
    return "参数无效";
  }
  
  courseId = parseInt(courseId);
  
  // 获取当前课程信息
  const course = scheduleData.courses.find(c => c.id === courseId);
  if (!course) {
    return "找不到课程";
  }
  
  // 计算课程时长（节数）
  const courseDuration = course.endTime ? (course.endTime - course.time + 1) : 1;
  
  // 检查时间是否超出范围
  if (targetTime + courseDuration - 1 > scheduleData.timePeriods.length) {
    return `课程需要连续${courseDuration}节课，会超出课表范围 (最大时间段为${scheduleData.timePeriods.length})`;
  }
  
  // 检查每个格子的占用情况
  for (let t = targetTime; t < targetTime + courseDuration; t++) {
    const cellKey = `${targetDay}-${t}`;
    const occupyingCourseId = coursesCache.occupiedCells.get(cellKey);
    
    if (occupyingCourseId !== undefined && occupyingCourseId !== courseId) {
      const conflictCourse = scheduleData.courses.find(c => c.id === occupyingCourseId);
      if (conflictCourse) {
        return `第${t}节与「${conflictCourse.title}」时间冲突`;
      }
    }
  }
  
  return "无法放置";
}

// 导出缓存对象以便可能的扩展需要
export { coursesCache };