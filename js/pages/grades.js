import { checkFirstLoginExperience } from '/js/auth.js';
import { initScrollAnimation } from "/components/scrollAnimation/scrollAnimation.js";

document.addEventListener("DOMContentLoaded", function () {
// 检查首次登录体验
//   checkFirstLoginExperience(); // 调试时临时注释掉
  // 初始化滚动动画
  initScrollAnimation(".animate-on-scroll", {
    threshold: 0.1,
    once: true,
  });

  // 公共GPA数据 - 从多个函数中抽取出来作为共享变量
  const gpaData = {
    labels: ["2022-2", "2023-1", "2023-2", "2024-1", "2024-2"],
    values: [3.2, 3.4, 3.6, 3.7, 3.85]
  };

  // "导出成绩单"按钮功能与"开发中"提示
  const exportGradesBtn = document.querySelector('.btn i.fa-file-export')
  if (exportGradesBtn) {
    exportGradesBtn.closest('button').addEventListener('click', function() {
      window.showNotification('导出成绩单功能正在开发中...', 'info');
    });
  }

  // "筛选"按钮功能与"开发中"提示
  const filterBtn = document.querySelector('.btn i.fa-filter')
  if (filterBtn) {
    filterBtn.closest('button').addEventListener('click', function() {
      window.showNotification('筛选功能正在开发中...', 'info');
    });
  }

  // "分享成绩"按钮功能与"开发中" 提示
  const shareGradesBtn = document.getElementById('shareGradesBtn');
  if (shareGradesBtn) {
    shareGradesBtn.addEventListener('click', function() {
      window.showNotification('成绩分享功能正在开发中，即将支持分享给家长或导师...', 'info');
    });
  }

  // 保存图表引用
  let chartInstances = {};

  // 等待页面完全加载，确保Chart.js已加载完成
  window.addEventListener('load', function() {
    if (typeof Chart !== 'undefined') {
      // Chart.js已加载，直接渲染图表
      setTimeout(renderCharts, 100);
    } else {
      let attempts = 0;
      const maxAttempts = 20; // 最多尝试20次
      const checkInterval = setInterval(function() {
        attempts++;
        
        if (typeof Chart !== 'undefined') {
          clearInterval(checkInterval);
          renderCharts();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('Chart.js加载失败，请刷新页面重试');
          window.showNotification && window.showNotification('图表加载失败，请刷新页面重试', 'error');
        }
      }, 500);
    }
  });

  // 获取CSS变量的辅助函数
  function getCSSVariableValue(variableName) {
    return getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
  }

  // 获取当前主题的文本和边框颜色
  function getThemeColors() {
    return {
      textColor: getCSSVariableValue('--text-color'),
      secondaryTextColor: getCSSVariableValue('--text-secondary'),
      borderColor: getCSSVariableValue('--border-color'),
      backgroundColor: getCSSVariableValue('--background-color')
    };
  }

  // 更新统计信息
  function updateStatistics() {
    // 计算GPA和平均分
    const totalCoursesElement = document.getElementById("total-courses");
    const gradesTableBody = document.getElementById("gradesTableBody");
    if (totalCoursesElement && gradesTableBody) {
        totalCoursesElement.textContent = gradesTableBody.getElementsByTagName("tr").length;
    }

    // 更新GPA值显示
    const gpaValueElement = document.getElementById("gpa-value");
    if (gpaValueElement && gpaData.values.length > 0) {
        // 显示最新的GPA值
        gpaValueElement.textContent = gpaData.values[gpaData.values.length - 1].toFixed(2);
    }

    // 未来可以添加其他统计数据更新
  }

  // 绘制所有图表
  function renderCharts() {
    if (typeof Chart === 'undefined') {
      console.warn('Chart.js尚未加载，将在2秒后重试渲染图表');
      setTimeout(renderCharts, 2000);
      return;
    }

    try {
      // 首先销毁所有存储的图表实例
      Object.values(chartInstances).forEach(instance => {
          if (instance && typeof instance.destroy === 'function') {
              instance.destroy();
          }
      });
      chartInstances = {}; // 清空引用

      // 渲染所有图表并存储实例
      chartInstances.trend = renderTrendChart();
      chartInstances.subject = renderSubjectChart();
      chartInstances.compare = renderCompareChart();
      chartInstances.gpaGauge = renderGpaGaugeChart();
      renderGpaHistoryList();
      
    } catch (error) {
      console.error('渲染图表时出错:', error);
    }
  }

  // 趋势图表
  function renderTrendChart() {
    const trendChartCtx = document.getElementById("trendChart");
    if (!trendChartCtx) return;
    const ctx = trendChartCtx.getContext("2d");
    const colors = getThemeColors();

    // 使用公共数据
    const data = {
      labels: gpaData.labels,
      datasets: [
        {
          label: "平均分",
          data: [78, 83, 87, 88, 92],
          borderColor: "#0F9D58",
          backgroundColor: "rgba(15, 157, 88, 0.1)",
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
        {
          label: "课程数量",
          data: [4, 5, 7, 8, 12],
          borderColor: "#DB4437",
          backgroundColor: "rgba(219, 68, 55, 0.1)",
          borderWidth: 2,
          fill: false,
          tension: 0.2,
          borderDash: [5, 5],
          yAxisID: 'y1',
        },
      ],
    };

    new Chart(ctx, {
      type: "line",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: false,
            ticks: {
              color: colors.textColor
            },
            grid: {
              color: colors.borderColor
            }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: {
              drawOnChartArea: false,
              color: colors.borderColor
            },
            beginAtZero: true,
            ticks: {
              color: colors.textColor
            }
          },
          x: {
            ticks: {
              color: colors.textColor
            },
            grid: {
              color: colors.borderColor
            }
          }
        },
        plugins: {
          legend: {
            position: "top",
            labels: {
              color: colors.textColor
            }
          },
        },
      },
    });
  }

  // 科目分布图
  function renderSubjectChart() {
    const subjectChartCtx = document.getElementById("subjectChart");
    if (!subjectChartCtx) return;
    const ctx = subjectChartCtx.getContext("2d");
    const colors = getThemeColors();

    const data = {
      labels: [
        "高等数学",
        "程序设计",
        "大学物理",
        "大学英语",
        "数据库原理",
        "操作系统",
        "计算机网络",
        "线性代数",
        "软件工程",
        "人工智能导论"
      ],
      datasets: [
        {
          data: [92, 98, 78, 88, 95, 73, 76, 85, 96, 93],
          backgroundColor: "rgba(66, 133, 244, 0.6)",
          borderColor: "rgba(66, 133, 244, 0.8)",
          borderWidth: 2,
          pointBackgroundColor: colors.backgroundColor,
          pointBorderColor: colors.textColor,
          pointHoverBackgroundColor: "#4285F4",
          pointHoverBorderColor: colors.textColor,
          pointRadius: 4,
          pointHoverRadius: 6
        },
      ],
    };

    new Chart(ctx, {
      type: "radar",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: colors.textColor
            },
            grid: {
              color: colors.borderColor
            },
            pointLabels: {
              color: colors.textColor,
              font: {
                size: 10
              }
            },
            angleLines: {
              color: colors.borderColor
            }
          },
        },
        plugins: {
          legend: {
            display: false,
            labels: {
              color: colors.textColor
            }
          }
        },
        layout: {
          padding: {
            top: 10,
            bottom: 10,
            left: 10,
            right: 10
          }
        }
      },
    });
  }

  // 比较图表
  function renderCompareChart() {
    const compareChartCtx = document.getElementById("compareChart");
    if (!compareChartCtx) return null;
    const ctx = compareChartCtx.getContext("2d");
    const colors = getThemeColors();

    const data = {
      labels: [
        "高等数学", "程序设计", "大学物理", "大学英语", "数据库", "操作系统",
        "计网", "线代", "软件工程", "人工智能", "概率统计", "图形学"
      ],
      datasets: [
        {
          label: "你的分数",
          data: [92, 98, 78, 88, 95, 73, 76, 85, 96, 93, 58, 89],
          backgroundColor: "rgba(66, 133, 244, 0.7)",
          borderColor: "rgba(66, 133, 244, 1)",
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: "rgba(66, 133, 244, 0.9)",
        },
        {
          label: "班级平均",
          data: [86, 85, 83, 90, 87, 79, 82, 80, 88, 84, 76, 85],
          backgroundColor: "rgba(244, 160, 0, 0.7)",
          borderColor: "rgba(244, 160, 0, 1)",
          borderWidth: 1,
          borderRadius: 4,
          hoverBackgroundColor: "rgba(244, 160, 0, 0.9)",
        },
        {
          label: "院系最高分",
          data: [98, 100, 95, 97, 99, 96, 94, 97, 100, 98, 93, 96],
          backgroundColor: "rgba(15, 157, 88, 0.2)",
          borderColor: "rgba(15, 157, 88, 1)",
          borderWidth: 2,
          type: 'line',
          fill: false,
          tension: 0.1,
          pointBackgroundColor: colors.backgroundColor,
          pointBorderColor: colors.textColor,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBorderWidth: 2
        }
      ],
    };

    return new Chart(ctx, {
      type: "bar",
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              stepSize: 20,
              color: colors.textColor,
              padding: 5,
            },
            grid: {
              color: colors.borderColor
            }
          },
          x: { 
            ticks: { 
              color: colors.textColor,
              font: {
                size: 9
              },
              maxRotation: 45,
              minRotation: 45
            }, 
            grid: { color: colors.borderColor } 
          }
        },
        plugins: {
          legend: { 
            position: "top", 
            labels: { 
              color: colors.textColor,
              boxWidth: 15,
              padding: 10
            } 
          },
        },
        layout: {
          padding: {
            top: 40,
            right: 20,
            left: 10,
            bottom: 20
          }
        }
      },
    });
  }

  // GPA 仪表盘图表
  function renderGpaGaugeChart() {
    const gpaGaugeCtx = document.getElementById("gpaGaugeChart");
    if (!gpaGaugeCtx) return null;
    const ctx = gpaGaugeCtx.getContext("2d");
    const colors = getThemeColors();

    // 使用公共GPA数据
    const latestGpa = gpaData.values.length > 0 ? gpaData.values[gpaData.values.length - 1] : 0;
    const previousGpa = gpaData.values.length > 1 ? gpaData.values[gpaData.values.length - 2] : null;
    const maxGpa = 4.0;

    // 计算趋势指示
    let trendIcon = '';
    let trendColor = colors.textColor;
    if (previousGpa !== null) {
      if (latestGpa > previousGpa) { trendIcon = '▲'; trendColor = '#0F9D58'; }
      else if (latestGpa < previousGpa) { trendIcon = '▼'; trendColor = '#DB4437'; }
      else { trendIcon = '━'; }
    }

    // 仪表盘数据集
    const gaugeData = {
      datasets: [{
        data: [latestGpa, Math.max(0, maxGpa - latestGpa)],
        backgroundColor: [ getCSSVariableValue('--primary-color'), getCSSVariableValue('--border-color') || '#e0e0e0' ],
        borderColor: colors.backgroundColor,
        borderWidth: 2,
        circumference: 180, rotation: 270, cutout: '70%'
      }]
    };

    // 中心绘制文本
    const centerTextPlugin = {
      id: 'centerText',
      afterDraw: (chart) => {
        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
        ctx.save();
        const centerX = left + width / 2;
        const centerY = chart.height - 45;

        ctx.font = 'bold 2.5em sans-serif';
        ctx.fillStyle = colors.textColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(latestGpa.toFixed(2), centerX, centerY);

        // 趋势图标和文字
        if (trendIcon) {
          // 绘制趋势图标和文字，相对于 GPA 值的位置
          const trendY = centerY + 5; // 在 GPA 值下方一点
          ctx.font = 'bold 1.5em sans-serif';
          ctx.fillStyle = trendColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          ctx.fillText(trendIcon, centerX, trendY);

          ctx.font = '0.9em sans-serif';
          ctx.fillStyle = colors.secondaryTextColor;
          const prevLabel = gpaData.labels.length > 1 ? gpaData.labels[gpaData.labels.length - 2] : '';
          ctx.fillText(`较上学期 (${prevLabel})`, centerX, trendY + 25); // 在趋势图标下方
        } else if (gpaData.labels.length > 0) {
           // 绘制最新学期标签，相对于 GPA 值的位置
           ctx.font = '0.9em sans-serif';
           ctx.fillStyle = colors.secondaryTextColor;
           ctx.textAlign = 'center';
           ctx.textBaseline = 'top';
           ctx.fillText(`最新学期 (${gpaData.labels[gpaData.labels.length - 1]})`, centerX, centerY + 10);
        }
        ctx.restore();
      }
    };

    // 图表实例
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: gaugeData,
      options: {
        responsive: true, maintainAspectRatio: true, aspectRatio: 2,
        plugins: { legend: { display: false }, tooltip: { enabled: false }, centerText: {} }
      },
      plugins: [centerTextPlugin]
    });
    return chart;
  }

  // 监听主题变化，重新渲染图表
  document.addEventListener('themeChanged', function() {
    Object.values(chartInstances).forEach(instance => {
        if (instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }
    });
    chartInstances = {};
    renderCharts();
  });

  // 渲染 GPA 历史列表
  function renderGpaHistoryList() {
    const container = document.getElementById('gpaHistoryListContainer');
    if (!container) return;

    // 使用之前定义的公共GPA数据
    container.innerHTML = '<h4>历史 GPA</h4>';

    if (gpaData.values.length === 0) {
      container.innerHTML += '<p>暂无历史 GPA 数据</p>';
      return;
    }

    const list = document.createElement('ul');
    // 显示最新学期在顶部
    for (let i = gpaData.values.length - 1; i >= 0; i--) {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <span class="semester">${gpaData.labels[i]}</span>
        <span class="gpa-value">${gpaData.values[i].toFixed(2)}</span>
      `;
      list.appendChild(listItem);
    }
    container.appendChild(list);
  }

});

import { Sidebar } from "/components/sidebar/sidebar.js";
import { Header } from "/components/header/header.js";

document.addEventListener("DOMContentLoaded", function () {
  const sidebar = new Sidebar("sidebar-container");
  const header = new Header("header-container", {
    title: "成绩管理",
    subtitle: "记录并分析你的学术表现，查看成绩趋势和GPA计算",
    buttons: [],
  });
});
