/* ============================================
   同城AI共建商圈 · V3 交互
   粒子动画 · 数字滚动 · 折叠面板 · 导航菜单
   ============================================ */
(function () {
  'use strict';

  /* ========== 粒子背景系统 ========== */
  var canvas = document.getElementById('particleCanvas');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var particles = [];
    var P_COUNT = window.innerWidth < 640 ? 40 : 80;
    var mouse = { x: -999, y: -999 };
    var rafId = null;
    var isMobile = window.innerWidth < 640;
    var fpsLimit = isMobile ? 30 : 0; // 0 = unlimited
    var lastFrameTime = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    }

    function initParticles() {
      particles = [];
      for (var i = 0; i < P_COUNT; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: Math.max(1, Math.random() * 2 + 0.5),
          alpha: Math.random() * 0.5 + 0.15,
          hue: Math.random() > 0.7 ? 25 : 20 // orange-ish hue range
        });
      }
    }

    function drawParticle(p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'hsla(' + p.hue + ', 95%, 60%,' + p.alpha + ')';
      ctx.fill();
    }

    function connectParticles() {
      for (var a = 0; a < particles.length; a++) {
        for (var b = a + 1; b < particles.length; b++) {
          var dx = particles[a].x - particles[b].x;
          var dy = particles[a].y - particles[b].y;
          var dist = dx * dx + dy * dy;
          if (dist < 12000) { // ~110px
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.strokeStyle = 'rgba(255,107,53,' + (0.08 * (1 - dist / 12000)) + ')';
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
    }

    function animate(timestamp) {
      if (fpsLimit > 0 && timestamp - lastFrameTime < 1000 / fpsLimit) {
        rafId = requestAnimationFrame(animate);
        return;
      }
      lastFrameTime = timestamp;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // 鼠标排斥效果
        var mdx = p.x - mouse.x;
        var mdy = p.y - mouse.y;
        var mdist = mdx * mdx + mdy * mdy;
        if (mdist < 16000) { // ~126px
          var force = (126 - Math.sqrt(mdist)) / 126;
          p.vx += mdx * force * 0.008;
          p.vy += mdy * force * 0.008;
        }

        // 边界反弹
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        // 速度衰减
        p.vx *= 0.995;
        p.vy *= 0.995;

        drawParticle(p);
      }
      connectParticles();
      rafId = requestAnimationFrame(animate);
    }

    // 鼠标追踪
    document.addEventListener('mousemove', function (e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', function () {
      mouse.x = -999; mouse.y = -999;
    });

    window.addEventListener('resize', resize);
    resize();
    animate();
  }


  /* ========== 滚动渐显动画 ========== */
  var animEls = document.querySelectorAll('[data-animate]');
  var animObserver = null;

  if ('IntersectionObserver' in window && animEls.length) {
    animObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          // stagger delay by index within visible set
          var idx = Array.from(animEls).indexOf(entry.target);
          entry.target.style.transitionDelay = (Math.min(idx, 4) * 0.1) + 's';
          entry.target.classList.add('is-visible');
          animObserver.unobserve(entry.target);

          // 触发数字计数器
          triggerCounters(entry.target);
        }
      });
    }, { threshold: 0.12 });

    animEls.forEach(function (el) { animObserver.observe(el); });

    // 兜底：滚动事件检查未触发元素
    var scrollCheck = function () {
      var vh = window.innerHeight;
      animEls.forEach(function (el) {
        if (!el.classList.contains('is-visible')) {
          var r = el.getBoundingClientRect();
          if (r.top < vh - 80) {
            el.style.transitionDelay = '0s';
            el.classList.add('is-visible');
            triggerCounters(el);
          }
        }
      });
    };

    window.addEventListener('scroll', scrollCheck, { passive: true });
    setTimeout(scrollCheck, 800);
  } else {
    // 降级
    animEls.forEach(function (el) { el.classList.add('is-visible'); triggerCounters(el); });
  }


  /* ========== 数字滚动计数器 ========== */
  function triggerCounters(container) {
    var nums = (container || document).querySelectorAll('[data-count]');
    nums.forEach(function (numEl) {
      if (numEl.dataset.counted) return;
      numEl.dataset.counted = 'true';

      var target = parseInt(numEl.getAttribute('data-count'), 10);
      var duration = 1500;
      var start = performance.now();

      function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        // ease-out-expo
        var eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        numEl.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }


  /* ========== 导航栏滚动变色 ========== */
  var nav = document.getElementById('nav');
  var backtop = document.getElementById('backtop');
  var fixedCta = document.getElementById('fixedCta');
  var heroSection = document.getElementById('hero');

  // 更新导航链接激活状态
  var navLinks = document.querySelectorAll('.nav__link, .nav__m-link');
  var sections = ['hero','stats','about','projects','rules','cases','services','faq','submit','join'];

  function updateActiveLink() {
    var scrollY = window.scrollY || window.pageYOffset;
    sections.forEach(function (id, index) {
      var sec = document.getElementById(id);
      if (!sec) return;
      var top = sec.offsetTop - 100;
      var bottom = top + sec.offsetHeight;
      if (scrollY >= top && scrollY < bottom) {
        navLinks.forEach(function (l) {
          l.classList.remove('active');
          if (l.getAttribute('href') === '#' + id) l.classList.add('active');
        });
      }
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY || window.pageYOffset;

      // Nav scrolled state
      if (y > 50) nav.classList.add('scrolled');
      else nav.classList.remove('scrolled');

      // Backtop
      if (y > 500) backtop.classList.add('show');
      else backtop.classList.remove('show');

      // Fixed CTA
      if (heroSection) {
        var hBottom = heroSection.offsetTop + heroSection.offsetHeight - 100;
        if (y > hBottom) fixedCta.classList.add('show');
        else fixedCta.classList.remove('show');
      }

      // Active link
      updateActiveLink();

      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // init


  /* ========== 汉堡菜单交互 ========== */
  var burger = document.getElementById('navBurger');
  var mobileMenu = document.getElementById('mobileMenu');

  function toggleMenu() {
    var isOpen = burger.classList.toggle('open');
    mobileMenu.classList.toggle('open');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  function closeMenu() {
    burger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (burger) burger.addEventListener('click', toggleMenu);

  // 点击移动端链接后关闭菜单
  var mLinks = document.querySelectorAll('.nav__m-link');
  mLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });


  /* ========== 平滑锚点滚动 ========== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      var href = this.getAttribute('href');
      if (!href || href === '#') return;
      var target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      var navH = nav ? nav.offsetHeight : 72;
      var targetTop = target.getBoundingClientRect().top + window.scrollY - navH + 2;

      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    });
  });


  /* ========== 返回顶部 ========== */
  if (backtop) {
    backtop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* ========== 折叠面板增强（手风琴模式） ========== */
  function initAccordion(selector) {
    var items = document.querySelectorAll(selector);
    items.forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          items.forEach(function (other) {
            if (other !== item && other.open) {
              other.open = false;
            }
          });
        }
      });
    });
  }

  initAccordion('.accordion .acc-item');
  initAccordion('.faq-grid .faq-item');
  initAccordion('.hero__side-accordion .hero__side-item');

  // 锁定首屏右侧卡片高度，手风琴切换时不跳动
  (function lockCardHeight() {
    var card = document.querySelector('.hero__side-card');
    if (!card) return;
    card.style.height = card.offsetHeight + 'px';
  })();


  /* ========== 触屏设备检测 ========== */
  if (window.matchMedia('(pointer: coarse)').matches) {
    document.documentElement.classList.add('is-touch');
  }


  /* ========== 共建项目管理 ========== */
  (function initProjects() {
    var STORAGE_KEY = 'tcai_projects_v1';
    // SHA-256("admin123") — 密码哈希，避免明文存储
    var ADMIN_PASSWORD_HASH = '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9';
    function hexFromBuffer(buffer) {
      return Array.from(new Uint8Array(buffer))
        .map(function (b) { return b.toString(16).padStart(2, '0'); })
        .join('');
    }
    var _checkPassword = function (input) {
      try {
        var data = new TextEncoder().encode(input);
        return crypto.subtle.digest('SHA-256', data).then(function (hashBuffer) {
          return hexFromBuffer(hashBuffer) === ADMIN_PASSWORD_HASH;
        });
      } catch (e) { return Promise.resolve(false); }
    };

    var defaultProjects = [
      {
        id: 'p1',
        name: '柏康到家',
        desc: '一站式线上购药平台。26年5月上线，目前为推广阶段，此商城是 BtoBtoC 模式。',
        link: '#',
        contact: '',
        qrcode: '',
        qrcode2: '',
        status: '推广阶段',
        statusClass: ''
      },
      {
        id: 'p2',
        name: 'AI装企智能体',
        desc: '此项目为众筹项目，针对装修公司的一款全链接智能体，目前为初期预热阶段。',
        link: '#',
        contact: '',
        qrcode: '',
        qrcode2: '',
        status: '初期预热',
        statusClass: 'pre'
      },
      {
        id: 'p3',
        name: '项目待定',
        desc: '此项目点位预留中，欢迎有想法的伙伴提交共创方案，抱团落地。',
        link: '',
        contact: '',
        qrcode: '',
        qrcode2: '',
        status: '预留点位',
        statusClass: 'reserved'
      }
    ];

    function loadProjects() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    }

    function saveProjects(list) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
    }

    function getProjects() {
      var saved = loadProjects();
      if (saved && saved.length) return saved;
      saveProjects(defaultProjects);
      return defaultProjects;
    }

    function escapeHtml(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
    }

    function renderQr(src, label, name) {
      return src ?
        '<div class="project-card__qr">' +
          '<img loading="lazy" src="' + escapeHtml(src) + '" alt="' + escapeHtml(name) + ' ' + escapeHtml(label) + '">' +
          '<span>' + escapeHtml(label) + '</span>' +
        '</div>' :
        '<div class="project-card__qr project-card__qr--empty">' +
          '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/><path d="M14 14h7v7h-7zM17 17h1v1h-1zM14 17h1v1h-1zM17 14h1v1h-1z" stroke="currentColor" stroke-width="2"/></svg>' +
          '<span>' + escapeHtml(label) + '待上传</span>' +
        '</div>';
    }

    function renderProjects(filter) {
      var grid = document.getElementById('projectsGrid');
      if (!grid) return;
      var list = getProjects();
      if (filter && filter !== 'all') {
        list = list.filter(function (p) {
          return p.statusClass === filter;
        });
      }
      grid.innerHTML = list.map(function (p) {
        var reservedClass = p.statusClass === 'reserved' ? ' project-card--reserved' : '';
        var statusClass = 'project-card__status';
        if (p.statusClass === 'pre') statusClass += ' project-card__status--pre';
        else if (p.statusClass === '') statusClass += ' project-card__status--active';
        else if (p.statusClass === 'reserved') statusClass += ' project-card__status--reserved';

        return '<div class="project-card' + reservedClass + '" data-id="' + p.id + '">' +
          '<div class="project-card__header">' +
            '<h3 class="project-card__name">' + escapeHtml(p.name) + '</h3>' +
            '<span class="' + statusClass + '">' + escapeHtml(p.status || '进行中') + '</span>' +
          '</div>' +
          '<p class="project-card__desc">' + escapeHtml(p.desc) + '</p>' +
          '<div class="project-card__body">' +
            '<div class="project-card__qrs">' +
              renderQr(p.qrcode, '小程序码', p.name) +
              renderQr(p.qrcode2, '客服微信', p.name) +
            '</div>' +
            (p.link && p.link !== '#' ? '<a href="' + escapeHtml(p.link) + '" target="_blank" class="project-card__link">访问项目 →</a>' : '') +
          '</div>' +
        '</div>';
      }).join('');
    }

    // 管理后台入口 - 跳转到独立admin页面
    var adminTrigger = document.getElementById('adminTrigger');
    if (adminTrigger) {
      adminTrigger.addEventListener('click', function () {
        window.open('/admin.html', '_blank');
      });
    }

    // 底部二维码 - 从后台API读取
    function updateFooterQr() {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/api/faq-qr', true);
        xhr.onload = function () {
          if (xhr.status === 200) {
            try {
              var data = JSON.parse(xhr.responseText);
              // qr1 = 社群入群码, qr2 = 创始人微信
              if (data.qr1) {
                var groupImg = document.getElementById('groupQr');
                var groupPlaceholder = document.getElementById('groupQrPlaceholder');
                if (groupImg) { groupImg.src = data.qr1; groupImg.style.display = 'block'; }
                if (groupPlaceholder) groupPlaceholder.style.display = 'none';
              }
              if (data.qr2) {
                var founderImg = document.getElementById('founderQr');
                var founderPlaceholder = document.getElementById('founderQrPlaceholder');
                if (founderImg) { founderImg.src = data.qr2; founderImg.style.display = 'block'; }
                if (founderPlaceholder) founderPlaceholder.style.display = 'none';
              }
              // 更新标签文字
              if (data.label1) {
                var l1 = document.querySelector('.cta-qr-label--group');
                if (l1) l1.textContent = data.label1;
              }
              if (data.label2) {
                var l2 = document.querySelector('.cta-qr-label--founder');
                if (l2) l2.textContent = data.label2;
              }
            } catch (e) {}
          }
        };
        xhr.send();
      } catch (e) {}
    }
    updateFooterQr();

    // 分类筛选
    var filterBtns = document.querySelectorAll('.project-filter__btn');
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        filterBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderProjects(btn.dataset.filter);
      });
    });

    // 初始渲染
    renderProjects();
  })();


  /* ========== 共建规则（Rules） ========== */
  // 规则数据已移至 index.html 静态渲染


  /* ========== 点子墙（Ideas） ========== */
  (function initIdeas() {
    var IDEAS_KEY = 'tcai_ideas_v1';
    var SUBMIT_KEY = 'tcai_idea_submissions';
    var API_BASE = ''; // 部署后端后改为实际地址

    // 系统预置点子
    var systemIdeas = [
      { id: 'sys1', title: 'AI 智能客服', content: '为本地商家提供 7×24 小时智能客服解决方案，支持多轮对话、订单查询、售后处理。', category: 'system', isSystem: true, createdAt: '2026-07-01T10:00:00Z' },
      { id: 'sys2', title: '短视频自动生成', content: '基于 AI 的短视频批量生成工具，适合电商、餐饮、教育等行业快速产出营销素材。', category: 'system', isSystem: true, createdAt: '2026-07-02T14:30:00Z' },
      { id: 'sys3', title: '本地生活小程序', content: '整合同城餐饮、娱乐、购物、家政等服务的一站式小程序平台。', category: 'system', isSystem: true, createdAt: '2026-07-03T09:15:00Z' },
      { id: 'sys4', title: 'AI 辅助设计', content: '为中小企业提供 AI 辅助的 Logo、海报、包装设计服务，降低设计成本。', category: 'system', isSystem: true, createdAt: '2026-07-04T16:45:00Z' },
      { id: 'sys5', title: '智能排班系统', content: '针对餐饮、零售等行业的 AI 智能排班工具，优化人力成本。', category: 'system', isSystem: true, createdAt: '2026-07-05T11:20:00Z' },
      { id: 'sys6', title: 'AI 营销文案', content: '一键生成朋友圈文案、小红书笔记、电商详情页，支持多风格切换。', category: 'system', isSystem: true, createdAt: '2026-07-05T12:00:00Z' },
      { id: 'sys7', title: '智能数据看板', content: '为商家提供销售、客流、库存等多维度数据可视化与 AI 洞察。', category: 'system', isSystem: true, createdAt: '2026-07-05T13:00:00Z' },
      { id: 'sys8', title: 'AI 合同审查', content: '自动审查合同条款风险，标注异常条款，降低法务成本。', category: 'system', isSystem: true, createdAt: '2026-07-05T14:00:00Z' },
      { id: 'sys9', title: '智能招聘助手', content: 'AI 筛选简历、自动面试邀约、岗位匹配度分析，提升招聘效率。', category: 'system', isSystem: true, createdAt: '2026-07-05T15:00:00Z' },
      { id: 'sys10', title: 'AI 财税代账', content: '智能识别票据、自动生成凭证、一键报税，降低代理记账成本。', category: 'system', isSystem: true, createdAt: '2026-07-05T16:00:00Z' },
      { id: 'sys11', title: 'AI 语音转写', content: '会议录音实时转文字，自动提取关键决议和待办事项。', category: 'system', isSystem: true, createdAt: '2026-07-05T17:00:00Z' },
      { id: 'sys12', title: '智能培训平台', content: 'AI 生成课程内容、智能出题、学习路径个性化推荐。', category: 'system', isSystem: true, createdAt: '2026-07-05T18:00:00Z' },
      { id: 'sys13', title: 'AI 选品工具', content: '基于大数据分析趋势商品，为电商卖家提供选品建议。', category: 'system', isSystem: true, createdAt: '2026-07-06T09:00:00Z' }
    ];

    // 热门项目点子
    var hotIdeas = [
      { id: 'hot1', title: '社区团购平台', content: '基于 LBS 的社区团购小程序，支持团长管理、订单分拣、配送路线优化。', category: 'hot', createdAt: '2026-07-06T08:00:00Z' },
      { id: 'hot2', title: 'AI 英语陪练', content: '面向 K12 学生的 AI 英语口语陪练应用，支持发音纠正、情景对话。', category: 'hot', createdAt: '2026-07-06T12:30:00Z' },
      { id: 'hot3', title: '宠物服务平台', content: '整合宠物寄养、美容、医疗、用品的一站式本地服务平台。', category: 'hot', createdAt: '2026-07-07T15:00:00Z' },
      { id: 'hot4', title: 'AI 健康管理', content: '个人健康数据追踪 + AI 饮食运动建议，连接本地医疗资源。', category: 'hot', createdAt: '2026-07-07T16:00:00Z' },
      { id: 'hot5', title: '同城二手交易', content: '基于社区的二手物品交易平台，支持验货、议价、当面交易。', category: 'hot', createdAt: '2026-07-08T09:00:00Z' },
      { id: 'hot6', title: 'AI 写作助手', content: '公文写作、方案策划、创意文案，一键生成专业文档。', category: 'hot', createdAt: '2026-07-08T10:00:00Z' },
      { id: 'hot7', title: '本地家政预约', content: '家政服务在线预约平台，AI 智能匹配服务人员。', category: 'hot', createdAt: '2026-07-08T11:00:00Z' },
      { id: 'hot8', title: 'AI 简历优化', content: '智能简历诊断、一键优化、岗位匹配度评分。', category: 'hot', createdAt: '2026-07-08T12:00:00Z' },
      { id: 'hot9', title: '智能停车系统', content: '车位实时查询、预约停车、无感支付，覆盖全城停车场。', category: 'hot', createdAt: '2026-07-08T13:00:00Z' },
      { id: 'hot10', title: 'AI 情感分析', content: '用户评论情感分析工具，帮助商家洞察口碑趋势。', category: 'hot', createdAt: '2026-07-08T14:00:00Z' },
      { id: 'hot11', title: '同城跑腿服务', content: '即时跑腿代买代送，AI 路径规划优化配送效率。', category: 'hot', createdAt: '2026-07-08T15:00:00Z' },
      { id: 'hot12', title: 'AI 电商客服', content: '智能客服+订单跟踪+退换货处理，降低电商人力成本。', category: 'hot', createdAt: '2026-07-08T16:00:00Z' },
      { id: 'hot13', title: '智慧门店系统', content: '客流统计+热力图+智能推荐，线下门店数字化运营。', category: 'hot', createdAt: '2026-07-08T17:00:00Z' }
    ];

    // 客户发起点子
    var userIdeas = [
      { id: 'usr1', title: '装修报价助手', content: 'AI 根据户型图自动生成装修报价方案，透明化价格。', category: 'user', createdAt: '2026-07-09T08:00:00Z' },
      { id: 'usr2', title: '本地美食地图', content: '基于 AI 的美食推荐+导航，发现身边隐藏好店。', category: 'user', createdAt: '2026-07-09T09:00:00Z' },
      { id: 'usr3', title: '智能快递柜', content: '社区智能快递柜+AI 分拣+到件通知，提升末端配送效率。', category: 'user', createdAt: '2026-07-09T10:00:00Z' },
      { id: 'usr4', title: 'AI 证件照', content: '手机自拍一键生成标准证件照，支持多种规格。', category: 'user', createdAt: '2026-07-09T11:00:00Z' },
      { id: 'usr5', title: '邻里互助平台', content: '社区邻里间的互助信息发布与匹配平台。', category: 'user', createdAt: '2026-07-09T12:00:00Z' },
      { id: 'usr6', title: 'AI 面试模拟', content: 'AI 扮演面试官，智能提问并给出表现评分。', category: 'user', createdAt: '2026-07-09T13:00:00Z' },
      { id: 'usr7', title: '同城活动日历', content: '整合同城演出、展览、市集等活动信息，智能推荐。', category: 'user', createdAt: '2026-07-09T14:00:00Z' },
      { id: 'usr8', title: 'AI 美甲设计', content: '上传手部照片，AI 生成美甲方案并预约服务。', category: 'user', createdAt: '2026-07-09T15:00:00Z' },
      { id: 'usr9', title: '智慧菜市场', content: '菜市场数字化：线上点单+配送+溯源+价格监测。', category: 'user', createdAt: '2026-07-09T16:00:00Z' },
      { id: 'usr10', title: 'AI PPT 生成', content: '输入主题自动生成专业 PPT，支持模板切换。', category: 'user', createdAt: '2026-07-09T17:00:00Z' },
      { id: 'usr11', title: '本地健身管家', content: 'AI 制定训练计划+饮食建议+附近场馆推荐。', category: 'user', createdAt: '2026-07-09T18:00:00Z' },
      { id: 'usr12', title: '智能充电桩', content: '新能源车主找桩+预约充电+自动支付一站式服务。', category: 'user', createdAt: '2026-07-09T19:00:00Z' }
    ];

    // 最新创意点子
    var freshIdeas = [
      { id: 'frh1', title: 'AI 绘画定制', content: '上传照片 AI 生成艺术风格画作，可打印装饰画。', category: 'fresh', createdAt: '2026-07-09T20:00:00Z' },
      { id: 'frh2', title: '同城共享工具', content: '邻里间共享电动工具、厨具等闲置物品的平台。', category: 'fresh', createdAt: '2026-07-09T21:00:00Z' },
      { id: 'frh3', title: 'AI 音乐创作', content: '输入风格和主题 AI 生成背景音乐，适合短视频配乐。', category: 'fresh', createdAt: '2026-07-10T08:00:00Z' },
      { id: 'frh4', title: '智慧自习室', content: '付费自习室在线预约+AI 学习监督+环境智能调节。', category: 'fresh', createdAt: '2026-07-10T09:00:00Z' },
      { id: 'frh5', title: 'AI 塔罗占卜', content: 'AI 驱动的塔罗牌解读体验，娱乐社交属性。', category: 'fresh', createdAt: '2026-07-10T10:00:00Z' },
      { id: 'frh6', title: '同城拼车通勤', content: 'AI 智能匹配通勤路线，安全认证+费用分摊。', category: 'fresh', createdAt: '2026-07-10T11:00:00Z' },
      { id: 'frh7', title: 'AI 穿搭推荐', content: '根据身材数据和场景 AI 推荐穿搭方案+购买链接。', category: 'fresh', createdAt: '2026-07-10T12:00:00Z' },
      { id: 'frh8', title: '智能花店系统', content: '鲜花在线定制+AI 插花方案+同城极速配送。', category: 'fresh', createdAt: '2026-07-10T13:00:00Z' },
      { id: 'frh9', title: 'AI 旅游规划', content: '输入预算和时间 AI 生成旅行方案，含本地深度游。', category: 'fresh', createdAt: '2026-07-10T14:00:00Z' },
      { id: 'frh10', title: '社区团购2.0', content: '视频直播+AI 选品+社群裂变的新一代团购。', category: 'fresh', createdAt: '2026-07-10T15:00:00Z' },
      { id: 'frh11', title: 'AI 宠物翻译', content: 'AI 解读宠物叫声和肢体语言，帮助主人理解宠物。', category: 'fresh', createdAt: '2026-07-10T16:00:00Z' },
      { id: 'frh12', title: '本地仓储共享', content: '闲置仓储空间共享平台，AI 优化仓位分配。', category: 'fresh', createdAt: '2026-07-10T17:00:00Z' }
    ];

    function getIdeas() {
      var saved = [];
      try {
        var raw = localStorage.getItem(IDEAS_KEY);
        saved = raw ? JSON.parse(raw) : [];
      } catch (e) { saved = []; }
      // 合并系统预置 + 热门 + 客户发起 + 最新 + 用户提交
      var all = systemIdeas.concat(hotIdeas).concat(userIdeas).concat(freshIdeas).concat(saved);
      return all;
    }

    function saveIdeas(list) {
      // 只保存用户提交的，系统预置的每次动态合并
      var userOnly = list.filter(function (i) { return !i.isSystem && i.category !== 'system' && i.category !== 'hot' && i.category !== 'user' && i.category !== 'fresh'; });
      try { localStorage.setItem(IDEAS_KEY, JSON.stringify(userOnly)); } catch (e) {}
    }

    function getCachedIdeas() {
      return getIdeas();
    }

    function getCategoryFromIdea(idea) {
      if (idea.isSystem || idea.category === 'system') return 'system';
      if (idea.category === 'hot') return 'hot';
      if (idea.category === 'user') return 'user';
      return 'fresh';
    }

    function esc(str) {
      return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // 全局函数：打开点子详情
    window.openIdeaTag = function (title, content, isSystem, id) {
      var overlay = document.getElementById('ideaTagOverlay');
      var expandedTitle = document.getElementById('expandedTitle');
      var expandedContent = document.getElementById('expandedContent');
      var expandedBadge = document.getElementById('expandedBadge');
      if (!overlay) return;
      if (expandedTitle) expandedTitle.textContent = title || '';
      if (expandedContent) expandedContent.textContent = content || '';
      if (expandedBadge) expandedBadge.style.display = isSystem ? 'inline-block' : 'none';
      overlay.style.display = 'flex';
      overlay.dataset.ideaId = id || '';
    };

    window.closeIdeaTag = function () {
      var overlay = document.getElementById('ideaTagOverlay');
      if (overlay) overlay.style.display = 'none';
    };

    // 认领项目功能
    window.claimIdea = function () {
      var overlay = document.getElementById('ideaTagOverlay');
      var ideaId = overlay ? overlay.dataset.ideaId : '';
      var titleEl = document.getElementById('expandedTitle');
      var title = titleEl ? titleEl.textContent : '';
      
      // 弹出认领确认
      var claimOverlay = document.getElementById('claimOverlay');
      if (!claimOverlay) {
        claimOverlay = document.createElement('div');
        claimOverlay.id = 'claimOverlay';
        claimOverlay.style.cssText = 'position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);';
        claimOverlay.innerHTML = '<div style="background:#1a1a2e;border:1px solid rgba(255,107,53,0.3);border-radius:20px;padding:32px;max-width:420px;width:90%;text-align:center;">' +
          '<h3 style="color:#fff;font-size:20px;margin-bottom:12px;">🎉 认领项目</h3>' +
          '<p style="color:rgba(255,255,255,0.7);margin-bottom:8px;">你正在认领：</p>' +
          '<p id="claimTitle" style="color:#FF6B35;font-size:18px;font-weight:700;margin-bottom:20px;"></p>' +
          '<input id="claimName" type="text" placeholder="你的称呼" style="width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:rgba(255,255,255,0.05);color:#fff;font-size:15px;margin-bottom:12px;box-sizing:border-box;">' +
          '<input id="claimContact" type="text" placeholder="联系方式（手机/微信）" style="width:100%;padding:12px 16px;border:1px solid rgba(255,255,255,0.15);border-radius:10px;background:rgba(255,255,255,0.05);color:#fff;font-size:15px;margin-bottom:20px;box-sizing:border-box;">' +
          '<div style="display:flex;gap:12px;">' +
            '<button id="claimConfirm" style="flex:1;padding:12px;background:linear-gradient(135deg,#FF6B35,#FF8F5A);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;">确认认领</button>' +
            '<button id="claimCancel" style="flex:1;padding:12px;background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7);border:1px solid rgba(255,255,255,0.1);border-radius:10px;font-size:15px;cursor:pointer;">取消</button>' +
          '</div>' +
        '</div>';
        document.body.appendChild(claimOverlay);
      }
      
      var claimTitle = document.getElementById('claimTitle');
      if (claimTitle) claimTitle.textContent = title;
      claimOverlay.style.display = 'flex';
      
      // 关闭点子详情
      window.closeIdeaTag();
      
      // 绑定确认/取消
      var confirmBtn = document.getElementById('claimConfirm');
      var cancelBtn = document.getElementById('claimCancel');
      
      confirmBtn.onclick = function() {
        var name = document.getElementById('claimName').value.trim();
        var contact = document.getElementById('claimContact').value.trim();
        if (!name || !contact) {
          alert('请填写称呼和联系方式');
          return;
        }
        // 保存认领信息
        try {
          var claims = JSON.parse(localStorage.getItem('tcai_claims_v1') || '[]');
          claims.push({ ideaId: ideaId, title: title, name: name, contact: contact, claimedAt: new Date().toISOString() });
          localStorage.setItem('tcai_claims_v1', JSON.stringify(claims));
        } catch(e) {}
        claimOverlay.style.display = 'none';
        // 成功提示
        var successEl = document.createElement('div');
        successEl.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10002;background:#1a1a2e;border:1px solid rgba(76,175,80,0.3);border-radius:16px;padding:24px 32px;text-align:center;';
        successEl.innerHTML = '<p style="color:#4CAF50;font-size:18px;font-weight:700;">✅ 认领成功！</p><p style="color:rgba(255,255,255,0.6);margin-top:8px;font-size:14px;">我们将尽快联系你推进项目</p>';
        document.body.appendChild(successEl);
        setTimeout(function() { successEl.remove(); }, 2500);
      };
      
      cancelBtn.onclick = function() {
        claimOverlay.style.display = 'none';
      };
      
      claimOverlay.onclick = function(e) {
        if (e.target === claimOverlay) claimOverlay.style.display = 'none';
      };
    };

    // 点击遮罩关闭
    var overlay = document.getElementById('ideaTagOverlay');
    if (overlay) {
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeIdeaTag();
      });
    }

    // ESC 关闭
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeIdeaTag();
    });

    // 分类切换
    var currentIdeaCategory = 'all';
    var catBtns = document.querySelectorAll('.idea-cat__btn');
    catBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        catBtns.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentIdeaCategory = btn.dataset.cat || 'all';
        renderTags(getIdeas());
      });
    });

    function renderTags(list) {
      renderTree(list);
    }

    // 兼容老调用：renderTree → 渲染"星座图"
    function renderTree(list) {
      var container = document.getElementById('ideaTagsContainer');
      if (!container) return;
      if (!list || !list.length) {
        container.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;padding:80px 20px">还没有创意，期待你的灵感 💡</div>';
        return;
      }

      // 1. 分类统计
      var cats = { system: 0, hot: 0, user: 0, fresh: 0 };
      list.forEach(function(it) { cats[getCategoryFromIdea(it)]++; });
      var totalEl = document.getElementById('catCountAll');
      var sysEl = document.getElementById('catCountSystem');
      var hotEl = document.getElementById('catCountHot');
      var usrEl = document.getElementById('catCountUser');
      var frhEl = document.getElementById('catCountFresh');
      if (totalEl) totalEl.textContent = list.length;
      if (sysEl) sysEl.textContent = cats.system;
      if (hotEl) hotEl.textContent = cats.hot;
      if (usrEl) usrEl.textContent = cats.user;
      if (frhEl) frhEl.textContent = cats.fresh;

      // 2. 按当前分类过滤
      var filtered;
      if (currentIdeaCategory === 'all') {
        filtered = list.slice();
      } else {
        filtered = list.filter(function(it) { return getCategoryFromIdea(it) === currentIdeaCategory; });
      }
      if (!filtered.length) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-secondary);font-size:14px;padding:80px 20px">该分类下还没有创意</div>';
        return;
      }

      // 3. 打散顺序
      var shuffled = filtered.slice().sort(function() { return Math.random() - 0.5; });

      // 4. 用HTML+CSS实现星座图（不用SVG文字，用HTML标签更清晰）
      container.innerHTML = '';
      container.className = 'constellation-container';

      // 5. 画布尺寸
      var W = 1600;
      var H = 1000;
      var cx = W / 2;
      var cy = H / 2;

      // 6. 计算节点位置（椭圆三圈）
      var nodePositions = [];
      var count = shuffled.length;
      var ellipseRatio = 1.6;
      
      // 内圈
      var innerCount = Math.min(10, count);
      var innerRY = 150;
      var innerRX = innerRY * ellipseRatio;
      for (var i = 0; i < innerCount; i++) {
        var angle = (i / innerCount) * Math.PI * 2 - Math.PI / 2;
        nodePositions.push({
          x: cx + Math.cos(angle) * innerRX + (Math.random() - 0.5) * 15,
          y: cy + Math.sin(angle) * innerRY + (Math.random() - 0.5) * 10,
          layer: 'inner'
        });
      }
      
      // 中圈
      var midCount = Math.min(20, count - innerCount);
      var midRY = 280;
      var midRX = midRY * ellipseRatio;
      for (var i = 0; i < midCount; i++) {
        var angle = (i / midCount) * Math.PI * 2 - Math.PI / 2 + (Math.PI / midCount);
        nodePositions.push({
          x: cx + Math.cos(angle) * midRX + (Math.random() - 0.5) * 20,
          y: cy + Math.sin(angle) * midRY + (Math.random() - 0.5) * 12,
          layer: 'mid'
        });
      }
      
      // 外圈
      var outerCount = count - innerCount - midCount;
      var outerRY = 410;
      var outerRX = outerRY * ellipseRatio;
      for (var i = 0; i < outerCount; i++) {
        var angle = (i / outerCount) * Math.PI * 2 - Math.PI / 2 + (Math.PI / outerCount);
        nodePositions.push({
          x: cx + Math.cos(angle) * outerRX + (Math.random() - 0.5) * 25,
          y: cy + Math.sin(angle) * outerRY + (Math.random() - 0.5) * 15,
          layer: 'outer'
        });
      }

      // 7. SVG层：背景、连线、中心、星星点
      var svgParts = [];
      svgParts.push('<svg class="constellation-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">');
      svgParts.push('<defs>');
      svgParts.push('  <radialGradient id="centerGlow" cx="50%" cy="50%">');
      svgParts.push('    <stop offset="0%" stop-color="#FF6B35" stop-opacity="0.4" />');
      svgParts.push('    <stop offset="100%" stop-color="#FF6B35" stop-opacity="0" />');
      svgParts.push('  </radialGradient>');
      svgParts.push('  <filter id="starGlow" x="-100%" y="-100%" width="300%" height="300%">');
      svgParts.push('    <feGaussianBlur stdDeviation="4" result="blur" />');
      svgParts.push('    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>');
      svgParts.push('  </filter>');
      svgParts.push('  <filter id="centerShadow" x="-50%" y="-50%" width="200%" height="200%">');
      svgParts.push('    <feDropShadow dx="0" dy="3" stdDeviation="6" flood-color="#000" flood-opacity="0.4" />');
      svgParts.push('  </filter>');
      svgParts.push('</defs>');
      
      // 背景光晕
      svgParts.push('<circle cx="' + cx + '" cy="' + cy + '" r="300" fill="url(#centerGlow)" />');
      
      // 背景星点装饰
      for (var i = 0; i < 80; i++) {
        var sx = Math.random() * W;
        var sy = Math.random() * H;
        var sr = 0.5 + Math.random() * 1.5;
        var so = 0.15 + Math.random() * 0.25;
        svgParts.push('<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) + '" r="' + sr.toFixed(1) + '" fill="#FFF" opacity="' + so.toFixed(2) + '" />');
      }

      // 颜色映射
      var lineColors = { system: '#FF6B6B', hot: '#4CAF50', user: '#42A5F5', fresh: '#AB47BC' };
      var starColors = {
        system: ['#FF6B6B', '#E84545', '#FF8888'],
        hot:    ['#4CAF50', '#43A047', '#66BB6A'],
        user:   ['#42A5F5', '#1E88E5', '#64B5F6'],
        fresh:  ['#AB47BC', '#8E24AA', '#BA68C8']
      };

      // 连线
      shuffled.forEach(function(idea, idx) {
        if (idx >= nodePositions.length) return;
        var pos = nodePositions[idx];
        var cat = getCategoryFromIdea(idea);
        var lineColor = lineColors[cat] || '#AB47BC';
        
        var dx = pos.x - cx;
        var dy = pos.y - cy;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len;
        var ny = dx / len;
        var t1 = 0.3 + Math.random() * 0.1;
        var t2 = 0.65 + Math.random() * 0.1;
        var curve1 = (Math.random() - 0.5) * 60;
        var curve2 = (Math.random() - 0.5) * 40;
        var cp1x = cx + dx * t1 + nx * curve1;
        var cp1y = cy + dy * t1 + ny * curve1;
        var cp2x = cx + dx * t2 + nx * curve2;
        var cp2y = cy + dy * t2 + ny * curve2;
        
        var pathD = 'M ' + cx + ' ' + cy +
                   ' C ' + cp1x.toFixed(1) + ' ' + cp1y.toFixed(1) +
                   ', ' + cp2x.toFixed(1) + ' ' + cp2y.toFixed(1) +
                   ', ' + pos.x.toFixed(1) + ' ' + pos.y.toFixed(1);
        
        svgParts.push('<path class="constellation-line" data-idx="' + idx + '" d="' + pathD + '" stroke="' + lineColor + '" stroke-width="1.5" fill="none" opacity="0.3" stroke-linecap="round" />');
      });

      // 中心节点
      svgParts.push('<g class="constellation-center">');
      svgParts.push('  <circle cx="' + cx + '" cy="' + cy + '" r="110" fill="#FF6B35" opacity="0.08" />');
      svgParts.push('  <circle cx="' + cx + '" cy="' + cy + '" r="80" fill="#FF6B35" opacity="0.12" />');
      svgParts.push('  <circle cx="' + cx + '" cy="' + cy + '" r="58" fill="#FF6B35" filter="url(#centerShadow)" />');
      // 灯泡
      svgParts.push('  <g transform="translate(' + (cx - 16) + ', ' + (cy - 26) + ') scale(0.7)">');
      svgParts.push('    <path d="M18 2C10.3 2 4 8.3 4 16c0 4.4 2.1 8.4 5.5 11l1 1.5V32c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2v-3.5l1-1.5C30.4 24.4 32 20.4 32 16 32 8.3 25.7 2 18 2z" fill="#FFF" opacity="0.95" />');
      svgParts.push('    <line x1="12" y1="32" x2="24" y2="32" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" />');
      svgParts.push('    <line x1="14" y1="36" x2="22" y2="36" stroke="#FFF" stroke-width="2" stroke-linecap="round" />');
      svgParts.push('    <path d="M14 18 Q18 12 22 18" stroke="#FF6B35" stroke-width="1.5" fill="none" />');
      svgParts.push('  </g>');
      svgParts.push('  <text x="' + cx + '" y="' + (cy + 24) + '" text-anchor="middle" font-size="16" font-weight="900" fill="#FFF" font-family="inherit" letter-spacing="1">OPC</text>');
      svgParts.push('</g>');

      // 星星节点（SVG圆点 + 光晕）
      shuffled.forEach(function(idea, idx) {
        if (idx >= nodePositions.length) return;
        var pos = nodePositions[idx];
        var cat = getCategoryFromIdea(idea);
        var colors = starColors[cat] || starColors.fresh;
        var starColor = colors[idx % colors.length];
        var starR = pos.layer === 'inner' ? 8 : pos.layer === 'mid' ? 6 : 5;
        
        // 光晕
        svgParts.push('<circle cx="' + pos.x.toFixed(1) + '" cy="' + pos.y.toFixed(1) + '" r="' + (starR * 3) + '" fill="' + starColor + '" opacity="0.12" />');
        // 星星
        svgParts.push('<circle class="constellation-star" data-idx="' + idx + '" cx="' + pos.x.toFixed(1) + '" cy="' + pos.y.toFixed(1) + '" r="' + starR + '" fill="' + starColor + '" filter="url(#starGlow)" />');
      });

      svgParts.push('</svg>');
      
      // 8. SVG层 + HTML标签层叠加
      var svgLayer = document.createElement('div');
      svgLayer.className = 'constellation-svg-layer';
      svgLayer.innerHTML = svgParts.join('');
      container.appendChild(svgLayer);
      
      // HTML标签层（文字清晰）
      var labelLayer = document.createElement('div');
      labelLayer.className = 'constellation-label-layer';
      
      shuffled.forEach(function(idea, idx) {
        if (idx >= nodePositions.length) return;
        var pos = nodePositions[idx];
        var cat = getCategoryFromIdea(idea);
        var colors = starColors[cat] || starColors.fresh;
        var starColor = colors[idx % colors.length];
        
        var label = document.createElement('div');
        label.className = 'constellation-label constellation-label--' + pos.layer;
        label.dataset.idx = idx;
        
        // 计算百分比位置
        var leftPct = (pos.x / W * 100).toFixed(2);
        var topPct = (pos.y / H * 100).toFixed(2);
        label.style.left = leftPct + '%';
        label.style.top = topPct + '%';
        
        // 判断标签方向：左侧的标签放左边，右侧放右边
        var isLeft = pos.x < cx;
        label.style.transform = isLeft ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
        label.style.paddingLeft = isLeft ? '0' : '18px';
        label.style.paddingRight = isLeft ? '18px' : '0';
        label.style.textAlign = isLeft ? 'right' : 'left';
        
        // 标签内容
        var title = idea.title || '未命名';
        var dot = document.createElement('span');
        dot.className = 'constellation-label__dot';
        dot.style.backgroundColor = starColor;
        
        var text = document.createElement('span');
        text.className = 'constellation-label__text';
        text.textContent = title;
        
        if (isLeft) {
          label.appendChild(text);
          label.appendChild(dot);
        } else {
          label.appendChild(dot);
          label.appendChild(text);
        }
        
        // 交互
        label.addEventListener('click', function(e) {
          e.stopPropagation();
          window.openIdeaTag(idea.title || '', idea.content || '', cat === 'system', idea.id);
        });
        
        label.addEventListener('mouseenter', function() {
          label.classList.add('constellation-label--hover');
          var lines = svgLayer.querySelectorAll('.constellation-line');
          if (lines[idx]) { lines[idx].setAttribute('opacity', '0.8'); lines[idx].setAttribute('stroke-width', '2.5'); }
          var stars = svgLayer.querySelectorAll('.constellation-star');
          if (stars[idx]) stars[idx].setAttribute('r', parseFloat(stars[idx].getAttribute('r')) * 1.5);
        });
        label.addEventListener('mouseleave', function() {
          label.classList.remove('constellation-label--hover');
          var lines = svgLayer.querySelectorAll('.constellation-line');
          if (lines[idx]) { lines[idx].setAttribute('opacity', '0.3'); lines[idx].setAttribute('stroke-width', '1.5'); }
          var stars = svgLayer.querySelectorAll('.constellation-star');
          var origR = pos.layer === 'inner' ? 8 : pos.layer === 'mid' ? 6 : 5;
          if (stars[idx]) stars[idx].setAttribute('r', origR);
        });
        
        labelLayer.appendChild(label);
      });
      
      container.appendChild(labelLayer);

      // 9. 统计
      var statsEl = document.getElementById('ideaStats');
      if (statsEl) {
        var showCount = filtered.length;
        var totalCount = list.length;
        var catLabel = currentIdeaCategory === 'all' ? '全部' :
                       currentIdeaCategory === 'system' ? '系统精选' :
                       currentIdeaCategory === 'hot' ? '热门项目' :
                       currentIdeaCategory === 'user' ? '客户发起' : '最新创意';
        statsEl.innerHTML = '<span>✨ 星座图中有 <strong style="color:#fff">' + showCount + '</strong> 个创意 / 共 ' + totalCount + ' 个</span>' +
          '<span style="color:rgba(255,255,255,0.4)">分类: ' + catLabel + '</span>' +
          '<span style="color:rgba(255,255,255,0.4)">' +
            '<span style="color:#FF6B6B">●</span> ' + cats.system + ' 精选 · ' +
            '<span style="color:#4CAF50">●</span> ' + cats.hot + ' 热门 · ' +
            '<span style="color:#42A5F5">●</span> ' + cats.user + ' 发起 · ' +
            '<span style="color:#AB47BC">●</span> ' + cats.fresh + ' 最新' +
          '</span>';
      }
    }

    // 初始加载：先从缓存渲染，再从后端同步
    var cached = getCachedIdeas();
    if (cached.length) {
      renderTags(cached);
    }

    // 从后端同步数据
    if (API_BASE) {
      fetch(API_BASE + '/api/ideas').then(function (r) { return r.json(); }).then(function (remoteList) {
        if (remoteList && remoteList.length) {
          saveIdeas(remoteList);
          renderTags(getIdeas());
        }
      }).catch(function () {});
    }

    // 提交新点子
    var ideaForm = document.getElementById('ideaForm');
    if (ideaForm) {
      ideaForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var title = document.getElementById('ideaTitle').value.trim();
        var content = document.getElementById('ideaContent').value.trim();
        if (!title || !content) return;

        var newIdea = {
          id: 'u' + Date.now(),
          title: title,
          content: content,
          category: 'user',
          createdAt: new Date().toISOString()
        };

        var list = getIdeas();
        list.push(newIdea);
        saveIdeas(list);
        renderTags(list);

        // 同步到后端
        if (API_BASE) {
          fetch(API_BASE + '/api/ideas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newIdea)
          }).catch(function () {});
        }

        ideaForm.reset();
        alert('创意已挂上树梢！');
      });
    }
  })();


  /* ========== 案例（Cases）加载 ========== */
  (function loadCases() {
    var grid = document.getElementById('casesGrid');
    if (!grid) return;
    var cacheKey = 'tcai_cases_cache';
    var render = function (list) {
      if (!list || !list.length) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--c-white-50)">暂无案例</div>';
        return;
      }
      grid.innerHTML = list.map(function (c) {
        return '<div class="case-card">' +
          '<span class="case-card__tag">' + escHtml(c.tag || '') + '</span>' +
          '<h3 class="case-card__title">' + escHtml(c.title) + '</h3>' +
          '<p class="case-card__desc">' + escHtml(c.description || '') + '</p>' +
          '<div class="case-card__result">' +
            '<span class="case-card__result-label">成果</span>' +
            '<span>' + escHtml(c.result || '') + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
    };
    function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    // 先读缓存
    try {
      var cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached && cached.length) render(cached);
    } catch (e) {}

    // 从后端拉取
    var API = '';
    if (API) {
      fetch(API + '/api/cases').then(function (r) { return r.json(); }).then(function (list) {
        if (list && list.length) {
          try { localStorage.setItem(cacheKey, JSON.stringify(list)); } catch (e) {}
          render(list);
        }
      }).catch(function () {});
    }
  })();


  /* ========== 提交项目 ========== */
  (function initSubmit() {
    var form = document.getElementById('submitForm');
    if (!form) return;
    var SUBMIT_KEY = 'tcai_submissions_v1';

      var fileInput = document.getElementById('submitFiles');
      var filePreview = document.getElementById('submitFilePreview');
      var uploadedFiles = []; // { name, type, data (base64) }

      // 文件选择预览
      if (fileInput) {
        fileInput.addEventListener('change', function () {
          filePreview.innerHTML = '';
          uploadedFiles = [];
          var files = fileInput.files;
          for (var fi = 0; fi < files.length; fi++) {
            (function (file) {
              if (file.size > 5 * 1024 * 1024) return; // 单文件 5MB 限制
              var reader = new FileReader();
              reader.onload = function (e) {
                var isImg = file.type.startsWith('image/');
                var item = document.createElement('div');
                item.className = 'submit-file__preview-item';
                if (isImg) {
                  item.innerHTML = '<img src="' + e.target.result + '" alt="' + file.name + '">';
                } else {
                  item.innerHTML = '<span class="file-icon">📄</span>';
                }
                item.title = file.name;
                filePreview.appendChild(item);
                uploadedFiles.push({ name: file.name, type: file.type, data: e.target.result });
              };
              reader.readAsDataURL(file);
            })(files[fi]);
          }
        });
      }

      function getSubmissions() {
        try { return JSON.parse(localStorage.getItem(SUBMIT_KEY)) || []; }
        catch(e) { return []; }
      }

      function saveSubmissions(list) {
        try { localStorage.setItem(SUBMIT_KEY, JSON.stringify(list)); } catch(e) {}
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = document.getElementById('submitName').value.trim();
        var contact = document.getElementById('submitContact').value.trim();
        var title = document.getElementById('submitTitle').value.trim();
        var desc = document.getElementById('submitDesc').value.trim();

        if (!name || !contact || !title || !desc) return;

        // 同步提交到后端 API（可选）
        var API = API_BASE || 'http://localhost:3001';
        fetch(API + '/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, contact: contact, title: title, desc: desc, files: uploadedFiles })
        }).catch(function () {
          // 后端不可用时不阻塞，继续 localStorage
        });

        // localStorage 兜底
        var list = getSubmissions();
        list.push({
          id: 's' + Date.now(),
          name: name,
          contact: contact,
          title: title,
          desc: desc,
          files: uploadedFiles,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        saveSubmissions(list);

        form.innerHTML = '<div class="submit-form__success">' +
          '<svg viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h3>提交成功！</h3>' +
          '<p>感谢你的项目想法！管理员会尽快评估并与你联系。</p>' +
        '</div>';
      });
    })();

})();
