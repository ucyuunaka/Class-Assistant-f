// 考试倒计时数据管理模块
import { Storage } from '/js/main.js';

// 本地存储展示的默认数据
const DEFAULT_EXAMS = [
  {
    id: 1,
    name: "数据结构期末考试",
    subject: "数据结构与算法",
    date: "2025-05-17T09:00:00",
    location: "教学楼B-303",
    notes: "考试范围为教材第1-10章，开卷考试",
  },
  {
    id: 2,
    name: "计算机网络期中考试",
    subject: "计算机网络",
    date: "2025-05-22T14:00:00",
    location: "实验楼C-210",
    notes: "考试内容为TCP/IP协议和网络安全，闭卷考试",
  },
  {
    id: 3,
    name: "操作系统期末考试",
    subject: "操作系统原理",
    date: "2025-06-15T10:00:00",
    location: "教学楼A-501",
    notes: "考试范围全书，需重点复习进程管理和内存管理",
  },
  {
    id: 4,
    name: "高等数学期中考试",
    subject: "高等数学",
    date: "2025-05-30T13:30:00",
    location: "教学楼C-102",
    notes: "考试范围：微积分第1-3章",
  },
  {
    id: 5,
    name: "英语四级考试",
    subject: "英语",
    date: "2025-06-07T09:00:00",
    location: "教学楼A-101",
    notes: "请携带有效身份证件",
  },
  {
    id: 6,
    name: "Java 程序设计期末",
    subject: "程序设计",
    date: "2025-07-11T15:00:00",
    location: "机房",
    notes: "需要准备开发环境",
  },
  {
    id: 7,
    name: "线性代数期末考试",
    subject: "线性代数",
    date: "2025-04-10T10:00:00",
    location: "教学楼B-201",
    notes: "重中之重，需掌握课程全部内容",
  },
  {
    id: 8,
    name: "概率论与数理统计期末",
    subject: "概率论与数理统计",
    date: "2025-05-20T14:00:00",
    location: "教学楼D-405",
    notes: "考试时长三小时",
  },
];

// 存储的考试数据
let exams = [];

// 被删除的考试数据（用于撤销删除操作）
let deletedExamData = null;

/**
 * 从Storage加载考试数据
 * @returns {Array}
 */
export function loadExams() {
  exams = Storage.get("exams", DEFAULT_EXAMS);
  return exams;
}

/**
 * 保存考试数据到Storage
 */
export function saveExams() {
  Storage.save("exams", exams);
}

/**
 * 获取所有考试数据
 * @returns {Array} 考试数据数组的副本
 */
export function getAllExams() {
  return [...exams];
}

/**
 * 获取考试状态
 * @param {String} examDate - 考试日期
 * @returns {String} 状态标识：urgent, upcoming, distant, past
 */
export function getExamStatus(examDate) {
  const now = new Date();
  const examDateTime = new Date(examDate);
  const diffDays = Math.ceil(
    (examDateTime - now) / (1000 * 60 * 60 * 24)
  );
  
  if (diffDays <= 0) return "past";
  if (diffDays <= 7) return "urgent";
  if (diffDays <= 30) return "upcoming";
  return "distant";
}

/**
 * 获取考试状态信息
 * @param {String} status - 考试状态
 * @returns {Object} 包含显示文本、CSS类和边框颜色
 */
export function getStatusInfo(status) {
  switch (status) {
    case "urgent":
      return {
        text: "紧急",
        class: "status-urgent",
        borderColor: "var(--danger-color)",
      };
    case "upcoming":
      return {
        text: "即将到来",
        class: "status-upcoming",
        borderColor: "var(--warning-color)",
      };
    case "distant":
      return {
        text: "较远",
        class: "status-distant",
        borderColor: "var(--success-color)",
      };
    case "past":
      return {
        text: "已结束",
        class: "status-past",
        borderColor: "var(--text-secondary)",
      };
    default:
      return { text: "", class: "", borderColor: "transparent" };
  }
}

/**
 * 添加新考试
 * @param {Object} examData - 考试数据
 * @returns {Object} 新添加的考试对象
 */
export function addExam(examData) {
  const newId = exams.length > 0 ? Math.max(...exams.map(e => e.id)) + 1 : 1;
  const newExam = {
    id: newId,
    ...examData
  };
  exams.push(newExam);
  saveExams();
  return newExam;
}

/**
 * 更新考试信息
 * @param {Number} examId - 考试ID
 * @param {Object} updatedData - 更新的数据
 * @returns {Boolean} 是否更新成功
 */
export function updateExam(examId, updatedData) {
  const index = exams.findIndex(e => e.id === parseInt(examId));
  if (index !== -1) {
    exams[index] = {
      ...exams[index],
      ...updatedData
    };
    saveExams();
    return true;
  }
  return false;
}

/**
 * 删除考试
 * @param {Number} examId - 考试ID
 * @returns {Boolean} 是否删除成功
 */
export function deleteExam(examId) {
  const examIndex = exams.findIndex(e => e.id === Number(examId));
  if (examIndex === -1) return false;
  
  deletedExamData = {
    exam: {...exams[examIndex]},
    index: examIndex
  };
  
  exams.splice(examIndex, 1);
  saveExams();
  return true;
}

/**
 * 撤销删除考试的操作
 * @returns {Object|null} 恢复的考试对象，如果没有可恢复的考试则返回null
 */
export function undoDeleteExam() {
  if (!deletedExamData) return null;
  
  const { exam, index } = deletedExamData;
  
  // 如果索引超出范围，就添加到数组末尾
  if (index >= exams.length) {
    exams.push(exam);
  } else {
    // 否则插入到原来的位置
    exams.splice(index, 0, exam);
  }
  
  saveExams();
  
  const restoredExam = {...exam};
  deletedExamData = null;
  return restoredExam;
}

/**
 * 格式化日期
 * @param {Date} date - 要格式化的日期对象
 * @param {string} format - 格式化模板，支持 YYYY, MM, DD, HH, mm, ss
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date, format = "YYYY-MM-DD") {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return "无效日期";
  }
  
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  
  return format
    .replace("YYYY", year)
    .replace("MM", String(month).padStart(2, "0"))
    .replace("DD", String(day).padStart(2, "0"))
    .replace("HH", String(hours).padStart(2, "0"))
    .replace("mm", String(minutes).padStart(2, "0"))
    .replace("ss", String(seconds).padStart(2, "0"));
}

/**
 * 计算倒计时值
 * @param {Date} targetDate - 目标日期
 * @returns {Object} 包含天、时、分、秒的对象
 */
export function calculateCountdown(targetDate) {
  const now = new Date();
  const diff = Math.max(0, targetDate - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}