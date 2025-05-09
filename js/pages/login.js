import $ from 'jquery';

// 导入认证标记函数
import { markLoginFlowCompleted } from '/js/auth.js';
// LoginSignupSystem 模块化封装
// Removed IIFE start
    // 配置选项，使用默认值
    let config = {
        defaultAvatarUrl: "https://randomuser.me/api/portraits/men/32.jpg",
        welcomeTemplate: {
            login: "欢迎回来，{username}!",
            signup: "欢迎加入，{username}!"
        },
        generalWelcomeText: "嗨，别来无恙",
        autoInit: true // 【备用】保留 autoInit 以便后续判断
    };

    let isLoginOperation = true; // 默认为登录操作

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 初始化表单状态
    function initFormState() {
        $('#signup-form').addClass('form-flip-out');
    }

    // 绑定事件监听器
    function bindEventListeners() {
        $('#to-signup').click(function(e) {
            e.preventDefault();
            switchForm('login', 'signup');
        });

        $('#to-login').click(function(e) {
            e.preventDefault();
            switchForm('signup', 'login');
        });

        // 登录表单输入验证
        setupInputValidation('.login-email', 'icon-paper-plane');
        setupInputValidation('.login-password', 'icon-lock');

        // 登录表单阶段转换
        setupFormStageTransition(
            '.login-form .next-button.email',
            '.login-form .email-section',
            '.login-form .password-section',
            "登录：NetID输入完成"
        );

        // 登录表单完成处理
        $('.login-form .next-button.password').click(async function(){
            await handleFormSuccess(
                '登录',
                '.login-form .password-section',
                '.login-form .login-success',
                '.login-email'
            );
        });

        // 注册表单输入验证
        setupInputValidation('.signup-email', 'icon-paper-plane');
        setupInputValidation('.signup-password', 'icon-lock');
        setupInputValidation('.repeat-password', 'icon-repeat-lock');

        // 注册表单阶段转换
        setupFormStageTransition(
            '.signup-form .next-button.signup-email',
            '.signup-form .email-section',
            '.signup-form .password-section',
            "注册：NetID输入完成"
        );

        setupFormStageTransition(
            '.signup-form .next-button.signup-password',
            '.signup-form .password-section',
            '.signup-form .repeat-password-section',
            "注册：密码输入完成"
        );

        // 注册表单完成处理
        $('.signup-form .next-button.repeat-password').click(async function(){
            await handleFormSuccess(
                '注册',
                '.signup-form .repeat-password-section',
                '.signup-form .signup-success',
                '.signup-email'
            );
        });

        // 修改为点击跳转到 index.html
        $('.trigger-anim-replay').click(function() {
            window.location.href = '/index.html';
        });
    }

    // 通用表单切换函数
    async function switchForm(fromType, toType) {
        isLoginOperation = (toType === 'login');
        const fromForm = $(`#${fromType}-form`);
        const toForm = $(`#${toType}-form`);

        // 当前表单翻转隐藏
        fromForm.removeClass('form-flip-in').addClass('form-flip-out');
        await delay(600);
        fromForm.addClass('hidden');
        toForm.removeClass('hidden');
        await delay(50);

        toForm.removeClass('form-flip-out').addClass('form-flip-in');
        if (toType === 'signup') {
            $('body').addClass('signup-mode');
        } else {
            $('body').removeClass('signup-mode');
        }

        // 动画完成后重置表单
        await delay(600);
        resetForms(false);
    }

    // 修改resetForms函数，添加参数控制是否重置动画类
    function resetForms(resetAnimation = true) {
        // 重置表单状态
        $('.input-section').removeClass('fold-up');
        $('.email-section').removeClass('fold-up');
        $('.password-section').addClass('folded');
        $('.repeat-password-section').addClass('folded');
        $('.icon-paper-plane, .icon-lock, .icon-repeat-lock').removeClass('next');
        $('.success').css("marginTop", "-75px");
        $('input').val('');

        if (resetAnimation) {
            $('#window').removeClass('flip');
            $('.login-form, .signup-form').removeClass('form-flip-in form-flip-out');
            // 重置欢迎页面元素动画状态
            $('.welcome-element').css({
                'opacity': '0',
                'transform': 'translateY(-30px)'
            });
        }
    }

    // 鼠标悬停效果
    function setupHoverEffects() {
        $('.next-button').hover(function(){
            $(this).css('cursor', 'pointer');
        });
    }

    // 设置输入字段验证和图标变化
    function setupInputValidation(inputSelector, iconClass) {
        $(inputSelector).on("change keyup paste", function(){
            const iconSelector = $(this).closest('.form-base').find(`.${iconClass}`);
            if ($(this).val()) {
                iconSelector.addClass("next");
            } else {
                iconSelector.removeClass("next");
            }
        });
    }

    // 设置表单阶段转换
    function setupFormStageTransition(buttonSelector, currentSectionSelector, nextSectionSelector, logMessage) {
        $(buttonSelector).click(function(){
            $(currentSectionSelector).addClass("fold-up");
            $(nextSectionSelector).removeClass("folded");
        });
    }

    async function handleFormSuccess(formType, lastSectionSelector, successSelector, netIdSelector) {
        $(lastSectionSelector).addClass("fold-up");
        $(successSelector).css("marginTop", 0);
        var userNetId = $(netIdSelector).val();
        updateUserName(userNetId);

        // 先预先准备好欢迎元素（位置和透明度设为0），但不立即显示
        // 这样在翻转后它们会更快地显示出来
        $('.welcome-element').css({
            'opacity': '0',
            'transform': 'translateY(-20px)',
            'transition-duration': '0.4s'
        });
        markLoginFlowCompleted();
        await delay(2000);
        setTimeout(function() {
            $('.welcome-element').css({
                'opacity': '1',
                'transform': 'translateY(0)'
            });
        }, 200);

        $('#window').addClass('flip');

        await delay(4500); // 在欢迎信息显示 4.5 秒后会自动跳转
        window.location.href = '/index.html';
    }

    // 重构重置动画函数
    function resetAnimation() {
        var win = $('#window');

        win.stop().fadeOut(500)
            .promise()
            .then(function() {
                win.attr('style', '');
                win.removeClass('flip');

                resetForms();
                return switchForm('signup', 'login');
            })
            .then(function() {
                // 显示窗口并开始新的动画
                win.fadeIn(500);
            })
            .catch(function(error) {
                // 错误处理保留但移除了 console.error
            });
    }

    // 将NetID作为用户名显示
    function updateUserName(netId) {
        if(netId && netId.length > 0) {
            var username = netId;
            if(username) {
                $('.user-name').text(config.generalWelcomeText);

                if (isLoginOperation) {
                    $('.welcome').text(config.welcomeTemplate.login.replace('{username}', username));
                } else {
                    $('.welcome').text(config.welcomeTemplate.signup.replace('{username}', username));
                }
            }
        }
    }

    // 设置用户头像函数
    function updateUserAvatar(avatarUrl) {
        if(avatarUrl && avatarUrl.length > 0) {
            $('.avatar').attr('src', avatarUrl);
        } else {
            // 使用在线库作为默认头像
            $('.avatar').attr('src', config.defaultAvatarUrl);
        }
    }

    // 初始化函数
    function init(userConfig = {}) {
        config = $.extend({}, config, userConfig);

        updateUserAvatar(config.defaultAvatarUrl);
        initFormState();
        setupHoverEffects();
        bindEventListeners();
    }

    // 公开API
    const LoginSignupSystem = {
        init: init,
        updateUserAvatar: updateUserAvatar,
        updateUserName: updateUserName,
        resetForms: resetForms,
        resetAnimation: resetAnimation,
        config: function(newConfig) {
            config = $.extend({}, config, newConfig);
            return this;
        }
    };

if (LoginSignupSystem.config().autoInit !== false) {
    LoginSignupSystem.init();
}
// 确保在 DOM 加载后执行
document.addEventListener('DOMContentLoaded', () => {
    const windowElement = document.getElementById('window');
    if (windowElement) {
        // 稍微延迟以确保 opacity:0 被渲染
        requestAnimationFrame(() => {
             requestAnimationFrame(() => {
                windowElement.style.opacity = '1';
             });
        });
    }

    // ！！原有的初始化逻辑
    if (LoginSignupSystem.config().autoInit !== false) {
         LoginSignupSystem.init();
    }
});