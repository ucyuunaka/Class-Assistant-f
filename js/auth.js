// js/auth.js
import { Storage } from '/js/main.js';

/**
 * 检查用户是否已完成首次登录流程。
 * 如果未完成且当前不在登录页，则重定向到登录页。
 */
export function checkFirstLoginExperience() {
  const hasCompleted = Storage.get('hasCompletedLoginFlow');
  const isLoginPage = window.location.pathname.endsWith('/login.html') || window.location.pathname.endsWith('/login');

  if (hasCompleted !== true && !isLoginPage) {
    window.location.href = '/pages/login.html';
  }
}

/**
 * 标记用户已完成首次登录流程。
 * 仅在标记尚未设置时执行一次。
 */
export function markLoginFlowCompleted() {
  if (Storage.get('hasCompletedLoginFlow') !== true) {
    Storage.save('hasCompletedLoginFlow', true);
  }
}