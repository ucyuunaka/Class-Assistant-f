/**
 * 课表数据
 * 包含课程信息、时间段和星期数据
 */

// 事件系统 - 用于数据变更通知
const eventSystem = {
  events: {},
  subscribe: function(eventName, callback) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(callback);
    return () => this.unsubscribe(eventName, callback); // 返回取消订阅函数
  },
  unsubscribe: function(eventName, callback) {
    if (this.events[eventName]) {
      this.events[eventName] = this.events[eventName].filter(cb => cb !== callback);
    }
  },
  publish: function(eventName, data) {
    if (this.events[eventName]) {
      this.events[eventName].forEach(callback => callback(data));
    }
  }
};

// 课程基本定义
const courseDef = [
  {
    title: "操作系统",
    teacher: "谭老师",
    location: "东2-305",
    color: "course-computer",
    day: 1,
    timeSlots: [7, 8]
  },
  {
    title: "智能体集群控制技术（含实验）",
    teacher: "吕老师",
    location: "东1-101",
    color: "course-computer",
    day: 2,
    timeSlots: [3, 4]
  },
  {
    title: "物联网技术与应用",
    teacher: "李老师",
    location: "东1-101",
    color: "course-computer",
    day: 4,
    timeSlots: [5, 6]
  },
  {
    title: "最优化理论与方法",
    teacher: "李老师",
    location: "东2-206",
    color: "course-math",
    day: 3,
    timeSlots: [5, 6]
  },
  {
    title: "自然语言处理",
    teacher: "沈老师",
    location: "东1-101",
    color: "course-computer",
    day: 3,
    timeSlots: [9, 10]
  },
  {
    title: "软件工程（含实验）",
    teacher: "王老师",
    location: "东2-207",
    color: "course-computer",
    day: 1,
    timeSlots: [3, 4]
  },
  {
    title: "现代控制理论",
    teacher: "李老师",
    location: "东2-206",
    color: "course-physics",
    day: 4,
    timeSlots: [3, 4]
  },
  {
    title: "数字信号处理",
    teacher: "王老师",
    location: "东1-101",
    color: "course-computer",
    day: 2,
    timeSlots: [7, 8]
  },
  {
    title: "机器学习基础",
    teacher: "吴老师",
    location: "东2-305",
    color: "course-computer",
    day: 5,
    timeSlots: [3, 4]
  },
  {
    title: "计算机视觉",
    teacher: "陈老师",
    location: "东1-101",
    color: "course-computer",
    day: 5,
    timeSlots: [5, 6]
  },
  {
    title: "智能机器人导论",
    teacher: "赵老师",
    location: "东2-207",
    color: "course-physics",
    day: 2,
    timeSlots: [5, 6]
  },
  {
    title: "毕业设计指导",
    teacher: "导师组",
    location: "创新实验室",
    color: "course-sports",
    day: 6,
    timeSlots: [3, 4]
  },
  {
    title: "专业英语",
    teacher: "张老师",
    location: "外语楼206",
    color: "course-english",
    day: 3,
    timeSlots: [7, 8]
  },
  {
    title: "嵌入式系统",
    teacher: "林老师",
    location: "东2-207",
    color: "course-computer",
    day: 4,
    timeSlots: [7, 8]
  },
  {
    title: "人工智能导论",
    teacher: "黄老师",
    location: "东1-101",
    color: "course-computer",
    day: 1,
    timeSlots: [5, 6]
  },
  {
    title: "工业互联网技术与应用",
    teacher: "周老师",
    location: "东2-206",
    color: "course-computer",
    day: 5,
    timeSlots: [7, 8]
  }
];

// 根据课程定义生成课程记录
function generateCourses() {
  const courses = [];
  let courseId = 1;

  courseDef.forEach(def => {
    // 确保每门课程只生成一个课程记录，但可以跨越多个时间槽
    courses.push({
      id: courseId++,
      title: def.title,
      teacher: def.teacher,
      location: def.location,
      color: def.color,
      day: def.day,
      time: def.timeSlots[0], // 使用第一个时间槽作为课程开始时间
      endTime: def.timeSlots[def.timeSlots.length - 1], // 使用最后一个时间槽作为结束时间
      timeSlots: def.timeSlots // 保存所有时间槽信息
    });
  });

  return courses;
}

// 课表数据
export const scheduleData = {
  courses: generateCourses(),
  timePeriods: [
    { id: 1, time: "08:00-08:45" },
    { id: 2, time: "08:55-09:40" },
    { id: 3, time: "10:10-10:55" },
    { id: 4, time: "11:05-11:50" },
    { id: 5, time: "14:20-15:05" },
    { id: 6, time: "15:15-16:00" },
    { id: 7, time: "16:30-17:15" },
    { id: 8, time: "17:25-18:10" },
    { id: 9, time: "19:00-19:45" },
    { id: 10, time: "19:55-20:40" },
    { id: 11, time: "20:50-21:35" },
  ],
  days: [
    { id: 1, name: "周一" },
    { id: 2, name: "周二" },
    { id: 3, name: "周三" },
    { id: 4, name: "周四" },
    { id: 5, name: "周五" },
    { id: 6, name: "周六" },
    { id: 7, name: "周日" },
  ],
};

// 本地存储名
const STORAGE_KEY = 'classroom-assistant-schedule';

// 从本地存储加载数据
export function loadScheduleFromStorage() {
  try {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      const parsedData = JSON.parse(savedData);
      
      // 更新课程数据
      if (parsedData.courses && Array.isArray(parsedData.courses)) {
        scheduleData.courses = parsedData.courses;
      }
      
      return true;
    }
  } catch (error) {
    //console.error('从本地存储加载课表数据失败:', error);
  }
  
  return false;
}

// 保存数据到本地存储
export function saveScheduleToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      courses: scheduleData.courses
    }));
    return true;
  } catch (error) {
    console.error('保存课表数据到本地存储失败:', error);
    return false;
  }
}

// 添加课程
export function addCourse(courseData) {
  // 自动生成ID (当前最大ID + 1)
  const maxId = scheduleData.courses.reduce((max, course) => Math.max(max, course.id || 0), 0);
  const newCourse = {
    id: maxId + 1,
    ...courseData
  };
  
  scheduleData.courses.push(newCourse);
  saveScheduleToStorage();
  
  // 发布课程更新事件
  eventSystem.publish('course-updated', { type: 'add', course: newCourse });
  
  return newCourse;
}

// 更新课程
export function updateCourse(courseId, updatedData) {
  const courseIndex = scheduleData.courses.findIndex(course => course.id === courseId);
  if (courseIndex === -1) return false;
  
  const oldCourse = { ...scheduleData.courses[courseIndex] };
  scheduleData.courses[courseIndex] = { 
    ...scheduleData.courses[courseIndex], 
    ...updatedData 
  };
  
  saveScheduleToStorage();
  
  // 发布课程更新事件
  eventSystem.publish('course-updated', { 
    type: 'update', 
    course: scheduleData.courses[courseIndex],
    oldCourse
  });
  
  return true;
}

// 删除课程
export function deleteCourse(courseId) {
  const courseIndex = scheduleData.courses.findIndex(course => course.id === courseId);
  if (courseIndex === -1) return false;
  
  const deletedCourse = scheduleData.courses[courseIndex];
  scheduleData.courses.splice(courseIndex, 1);
  
  saveScheduleToStorage();
  
  // 发布课程更新事件
  eventSystem.publish('course-updated', { type: 'delete', course: deletedCourse });
  
  return true;
}

// 清空所有课程
export function clearCourses() {
  const oldCourses = [...scheduleData.courses];
  scheduleData.courses = [];
  
  saveScheduleToStorage();
  
  // 发布课程更新事件
  eventSystem.publish('course-updated', { type: 'clear', oldCourses });
  
  return true;
}

// 订阅课程变更事件
export function subscribeToCourseUpdates(callback) {
  return eventSystem.subscribe('course-updated', callback);
}

// 获取所有课程
export function getAllCourses() {
  return [...scheduleData.courses];
}

// 根据ID获取课程
export function getCourseById(id) {
  return scheduleData.courses.find(course => course.id === id) || null;
}

// 课程数据更新后的回调函数
export function afterCourseDataChanged() {
  saveScheduleToStorage();
  eventSystem.publish('course-updated', { type: 'general-update' });
}

// 移动课程到新的时间段
export function moveCourse(courseId, targetDay, targetTime) {
  // 将字符串ID转换为数字
  const numericId = parseInt(courseId);
  
  // 查找课程索引
  const courseIndex = scheduleData.courses.findIndex(course => course.id === numericId);
  
  // 如果找不到课程则返回失败
  if (courseIndex === -1) return false;
  
  // 获取课程
  const course = scheduleData.courses[courseIndex];
  
  // 更新课程信息
  const oldCourse = { ...course };
  
  // 计算课程时长（节数）
  const courseDuration = course.endTime ? (course.endTime - course.time + 1) : 1;
  
  // 更新课程日期和时间
  course.day = targetDay;
  course.time = targetTime;
  
  // 若是跨时间段课程，更新结束时间，保持时长不变
  if (courseDuration > 1) {
    course.endTime = targetTime + courseDuration - 1;
  }

  
  // 保存数据
  saveScheduleToStorage();
  
  // 发布课程更新事件
  eventSystem.publish('course-updated', { 
    type: 'move', 
    course: course,
    oldCourse: oldCourse
  });
  
  return true;
}

// 导出事件系统，供其他模块使用
export { eventSystem };