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

    // 管理后台
    var adminOverlay = document.getElementById('adminOverlay');
    var adminLogin = document.getElementById('adminLogin');
    var adminPanel = document.getElementById('adminPanel');
    var adminList = document.getElementById('adminList');
    var adminForm = document.getElementById('adminForm');

    function openAdmin() {
      if (adminOverlay) adminOverlay.style.display = 'flex';
    }
    function closeAdmin() {
      if (adminOverlay) adminOverlay.style.display = 'none';
      if (adminLogin) adminLogin.style.display = 'block';
      if (adminPanel) adminPanel.style.display = 'none';
    }

    function showAdminPanel() {
      if (adminLogin) adminLogin.style.display = 'none';
      if (adminPanel) adminPanel.style.display = 'block';
      renderAdminList();
    }

    function renderAdminList() {
      if (!adminList) return;
      var list = getProjects();
      adminList.innerHTML = list.map(function (p, idx) {
        return '<div class="admin-item" data-idx="' + idx + '">' +
          '<div class="admin-item__info">' +
            '<strong>' + escapeHtml(p.name) + '</strong>' +
            '<span>' + escapeHtml(p.status || '进行中') + '</span>' +
          '</div>' +
          '<div class="admin-item__actions">' +
            '<button class="admin-btn admin-btn--edit" onclick="window._editProject(' + idx + ')">编辑</button>' +
            '<button class="admin-btn admin-btn--del" onclick="window._delProject(' + idx + ')">删除</button>' +
          '</div>' +
        '</div>';
      }).join('');
    }

    window._editProject = function (idx) {
      var list = getProjects();
      var p = list[idx];
      if (!p) return;
      if (adminForm) {
        document.getElementById('adminId').value = p.id || '';
        document.getElementById('adminName').value = p.name || '';
        document.getElementById('adminDesc').value = p.desc || '';
        document.getElementById('adminLink').value = p.link || '';
        document.getElementById('adminContact').value = p.contact || '';
        document.getElementById('adminQrcode').value = p.qrcode || '';
        document.getElementById('adminQrcode2').value = p.qrcode2 || '';
        document.getElementById('adminStatus').value = p.status || '';
        document.getElementById('adminStatusClass').value = p.statusClass || '';
        adminForm.dataset.editIdx = idx;
      }
    };

    window._delProject = function (idx) {
      if (!confirm('确定删除此项目？')) return;
      var list = getProjects();
      list.splice(idx, 1);
      saveProjects(list);
      renderAdminList();
      renderProjects();
    };

    // 绑定事件
    var adminBtn = document.getElementById('adminBtn');
    if (adminBtn) adminBtn.addEventListener('click', openAdmin);

    var adminClose = document.getElementById('adminClose');
    if (adminClose) adminClose.addEventListener('click', closeAdmin);

    var adminLoginSubmit = document.getElementById('adminLoginSubmit');
    if (adminLoginSubmit) {
      adminLoginSubmit.addEventListener('click', function () {
        var pwd = document.getElementById('adminPwd').value;
        _checkPassword(pwd).then(function (ok) {
          if (ok) {
            showAdminPanel();
          } else {
            alert('密码错误');
          }
        });
      });
    }

    if (adminForm) {
      adminForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var list = getProjects();
        var idx = parseInt(adminForm.dataset.editIdx || '-1', 10);
        var proj = {
          id: document.getElementById('adminId').value.trim() || ('p' + Date.now()),
          name: document.getElementById('adminName').value.trim(),
          desc: document.getElementById('adminDesc').value.trim(),
          link: document.getElementById('adminLink').value.trim(),
          contact: document.getElementById('adminContact').value.trim(),
          qrcode: document.getElementById('adminQrcode').value.trim(),
          qrcode2: document.getElementById('adminQrcode2').value.trim(),
          status: document.getElementById('adminStatus').value.trim(),
          statusClass: document.getElementById('adminStatusClass').value.trim()
        };
        if (!proj.name) return;
        if (idx >= 0) {
          list[idx] = proj;
        } else {
          list.push(proj);
        }
        saveProjects(list);
        renderAdminList();
        renderProjects();
        adminForm.reset();
        adminForm.dataset.editIdx = '';
      });
    }

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
      { id: 'sys5', title: '智能排班系统', content: '针对餐饮、零售等行业的 AI 智能排班工具，优化人力成本。', category: 'system', isSystem: true, createdAt: '2026-07-05T11:20:00Z' }
    ];

    // 热门项目点子
    var hotIdeas = [
      { id: 'hot1', title: '社区团购平台', content: '基于 LBS 的社区团购小程序，支持团长管理、订单分拣、配送路线优化。', category: 'hot', createdAt: '2026-07-06T08:00:00Z' },
      { id: 'hot2', title: 'AI 英语陪练', content: '面向 K12 学生的 AI 英语口语陪练应用，支持发音纠正、情景对话。', category: 'hot', createdAt: '2026-07-06T12:30:00Z' },
      { id: 'hot3', title: '宠物服务平台', content: '整合宠物寄养、美容、医疗、用品的一站式本地服务平台。', category: 'hot', createdAt: '2026-07-07T15:00:00Z' }
    ];

    function getIdeas() {
      var saved = [];
      try {
        var raw = localStorage.getItem(IDEAS_KEY);
        saved = raw ? JSON.parse(raw) : [];
      } catch (e) { saved = []; }
      // 合并系统预置 + 热门 + 用户提交
      var all = systemIdeas.concat(hotIdeas).concat(saved);
      return all;
    }

    function saveIdeas(list) {
      // 只保存用户提交的，系统预置的每次动态合并
      var userIdeas = list.filter(function (i) { return !i.isSystem && !i.isHot; });
      try { localStorage.setItem(IDEAS_KEY, JSON.stringify(userIdeas)); } catch (e) {}
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

    // 兼容老调用：renderTree → 渲染"创意气泡树"
    function renderTree(list) {
      var container = document.getElementById('ideaTagsContainer');
      if (!container) return;
      if (!list || !list.length) {
        container.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.5);font-size:14px;padding:80px 20px">还没有创意，期待你的灵感挂上树梢 🌱</div>';
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

      // 4. SVG 画布
      var W = 1200;
      var H = 940;
      var cx = W / 2;
      var groundY = H - 30;
      var trunkBaseY = groundY;
      var trunkTop = groundY - 400;

      // 5. 树枝收集器
      var allBranches = [];
      var allSpots = [];

      function buildBranchPath(x1, y1, x2, y2, curve) {
        var mx = (x1 + x2) / 2;
        var my = (y1 + y2) / 2;
        var dx = x2 - x1, dy = y2 - y1;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var nx = -dy / len, ny = dx / len;
        var offset = (Math.random() - 0.5) * (curve || 0.18) * len;
        var cpx = mx + nx * offset;
        var cpy = my + ny * offset;
        return 'M ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
               ' Q ' + cpx.toFixed(1) + ' ' + cpy.toFixed(1) + ', ' + x2.toFixed(1) + ' ' + y2.toFixed(1);
      }

      function bezierPoint(t, x1, y1, cx1, cy1, cx2, cy2, x2, y2) {
        var it = 1 - t;
        return {
          x: it*it*it*x1 + 3*it*it*t*cx1 + 3*it*t*t*cx2 + t*t*t*x2,
          y: it*it*it*y1 + 3*it*it*t*cy1 + 3*it*t*t*cy2 + t*t*t*y2
        };
      }

      function growTree(startX, startY, angle, length, width, depth, layer, maxDepth) {
        if (depth > maxDepth || length < 14) return;
        var endX = startX + Math.cos(angle) * length;
        var endY = startY + Math.sin(angle) * length;
        var perpX = -Math.sin(angle);
        var perpY = Math.cos(angle);
        var bulge = (Math.random() - 0.4) * 0.22;
        var c1x = startX + Math.cos(angle) * length * 0.4 + perpX * length * bulge;
        var c1y = startY + Math.sin(angle) * length * 0.4 + perpY * length * bulge;
        var c2x = startX + Math.cos(angle) * length * 0.75 + perpX * length * bulge * 0.6;
        var c2y = startY + Math.sin(angle) * length * 0.75 + perpY * length * bulge * 0.6;
        var path = 'M ' + startX.toFixed(1) + ' ' + startY.toFixed(1) +
                   ' C ' + c1x.toFixed(1) + ' ' + c1y.toFixed(1) + ', ' +
                         c2x.toFixed(1) + ' ' + c2y.toFixed(1) + ', ' +
                         endX.toFixed(1) + ' ' + endY.toFixed(1);
        var branch = {
          path: path, endX: endX, endY: endY,
          startX: startX, startY: startY,
          width: width, layer: layer, depth: depth,
          c1x: c1x, c1y: c1y, c2x: c2x, c2y: c2y
        };
        allBranches.push(branch);
        if (depth >= 1) {
          allSpots.push({ x: endX, y: endY, layer: layer, parentAngle: angle, branch: branch });
          if (depth <= 2) {
            for (var mp = 0.45; mp < 0.95; mp += 0.5) {
              var pt = bezierPoint(mp, startX, startY, c1x, c1y, c2x, c2y, endX, endY);
              allSpots.push({ x: pt.x, y: pt.y, layer: layer, parentAngle: angle, branch: branch });
            }
          }
        }
        if (depth < maxDepth) {
          var subCount, spreadBase;
          if (depth === 0) { subCount = 5; spreadBase = 1.0; }
          else if (depth === 1) { subCount = 3; spreadBase = 0.55; }
          else if (depth === 2) { subCount = 2; spreadBase = 0.5; }
          else { subCount = Math.random() < 0.6 ? 2 : 1; spreadBase = 0.45; }
          for (var i = 0; i < subCount; i++) {
            var t = subCount === 1 ? 0 : (i / (subCount - 1)) * 2 - 1;
            var spread = t * spreadBase + (Math.random() - 0.5) * 0.2;
            var subAngle = angle + spread;
            if (subAngle > -Math.PI / 2 + 0.2) subAngle = -Math.PI / 2 + 0.2 + (Math.random() - 0.5) * 0.3;
            if (subAngle > -0.3) subAngle = -0.3 - Math.random() * 0.2;
            var subLength = length * (0.6 + Math.random() * 0.22);
            var subWidth = width * (0.55 + Math.random() * 0.15);
            growTree(endX, endY, subAngle, subLength, subWidth, depth + 1, layer, maxDepth);
          }
        }
      }

      // 生成 3 层树
      var trunkLen = 260;
      growTree(cx - 10, trunkBaseY, -Math.PI / 2 - 0.05, trunkLen + 25, 7, 0, 'far', 4);
      growTree(cx, trunkBaseY, -Math.PI / 2, trunkLen, 8.5, 0, 'mid', 4);
      growTree(cx + 8, trunkBaseY, -Math.PI / 2 + 0.04, trunkLen - 5, 9.5, 0, 'near', 4);

      // 6. 分配气泡挂点
      allSpots.sort(function() { return Math.random() - 0.5; });
      var layerMax = { far: 7, mid: 12, near: 18 };
      var layerCount = { far: 0, mid: 0, near: 0 };
      var usedSpots = [];
      allSpots.forEach(function(s) {
        if (layerCount[s.layer] >= layerMax[s.layer]) return;
        usedSpots.push(s);
        layerCount[s.layer]++;
      });
      while (usedSpots.length < shuffled.length && usedSpots.length > 0) {
        usedSpots.push(usedSpots[usedSpots.length % usedSpots.length]);
      }
      usedSpots = usedSpots.slice(0, shuffled.length);

      // 7. 气泡配色（参考图：深红、橙色、深灰、浅灰）
      var bubbleColors = {
        system: { fill: '#A0302A', stroke: '#7A2018', text: '#FFFFFF' },
        hot:    { fill: '#E8702A', stroke: '#C05A18', text: '#FFFFFF' },
        user:   { fill: '#5A5A5A', stroke: '#3A3A3A', text: '#FFFFFF' },
        fresh:  { fill: '#B0B0B0', stroke: '#8A8A8A', text: '#333333' }
      };

      // 气泡形状类型：ellipse, roundedRect, cloud, starBurst, circle, smallDot
      var shapeTypes = ['ellipse', 'roundedRect', 'cloud', 'starBurst', 'circle', 'smallDot'];

      // 8. SVG 渲染
      var svgParts = [];
      svgParts.push('<svg class="idea-tree__svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax meet" xmlns="http://www.w3.org/2000/svg">');

      svgParts.push('<defs>');
      // 树干渐变
      svgParts.push('  <linearGradient id="trunkGrad" x1="0%" y1="0%" x2="100%" y2="0%">');
      svgParts.push('    <stop offset="0%"  stop-color="#3A2110" />');
      svgParts.push('    <stop offset="30%" stop-color="#5A331B" />');
      svgParts.push('    <stop offset="60%" stop-color="#4A2A14" />');
      svgParts.push('    <stop offset="100%" stop-color="#2A1608" />');
      svgParts.push('  </linearGradient>');
      svgParts.push('  <linearGradient id="trunkHi" x1="0%" y1="0%" x2="100%" y2="0%">');
      svgParts.push('    <stop offset="0%" stop-color="rgba(255,210,150,0.25)" />');
      svgParts.push('    <stop offset="40%" stop-color="rgba(255,210,150,0.0)" />');
      svgParts.push('  </linearGradient>');

      // 气泡阴影
      svgParts.push('  <filter id="bubbleShadow" x="-50%" y="-30%" width="200%" height="160%">');
      svgParts.push('    <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.45" />');
      svgParts.push('  </filter>');
      svgParts.push('  <filter id="bubbleFar" x="-50%" y="-30%" width="200%" height="160%">');
      svgParts.push('    <feGaussianBlur stdDeviation="1.8" />');
      svgParts.push('  </filter>');
      svgParts.push('  <filter id="glow" x="-100%" y="-100%" width="300%" height="300%">');
      svgParts.push('    <feGaussianBlur stdDeviation="8" />');
      svgParts.push('  </filter>');
      svgParts.push('  <filter id="softGlow" x="-100%" y="-100%" width="300%" height="300%">');
      svgParts.push('    <feGaussianBlur stdDeviation="3" />');
      svgParts.push('  </filter>');
      svgParts.push('</defs>');

      // ---- 背景 ----
      svgParts.push('<ellipse cx="' + cx + '" cy="' + (H - 28) + '" rx="500" ry="34" fill="rgba(0,0,0,0.65)" />');
      svgParts.push('<ellipse cx="' + cx + '" cy="' + (H - 32) + '" rx="460" ry="22" fill="rgba(255,150,60,0.22)" filter="url(#glow)" />');

      for (var gpi = 0; gpi < 36; gpi++) {
        var gpx = 50 + Math.random() * (W - 100);
        var gpy = 50 + Math.random() * (H - 220);
        var gpr = 1.5 + Math.random() * 3.2;
        var gpo = 0.12 + Math.random() * 0.32;
        svgParts.push('<circle cx="' + gpx + '" cy="' + gpy + '" r="' + gpr + '" fill="#FFE3A8" opacity="' + gpo + '" filter="url(#softGlow)" />');
      }

      // ---- 树根 ----
      var roots = [
        { x1: cx - 55, y1: trunkBaseY + 8, x2: cx - 195, y2: trunkBaseY + 38, w: 24 },
        { x1: cx + 55, y1: trunkBaseY + 8, x2: cx + 200, y2: trunkBaseY + 32, w: 24 },
        { x1: cx - 22, y1: trunkBaseY + 10, x2: cx - 115, y2: trunkBaseY + 80, w: 16 },
        { x1: cx + 22, y1: trunkBaseY + 10, x2: cx + 120, y2: trunkBaseY + 75, w: 16 },
        { x1: cx - 5, y1: trunkBaseY + 12, x2: cx - 40, y2: trunkBaseY + 100, w: 11 },
        { x1: cx + 5, y1: trunkBaseY + 12, x2: cx + 40, y2: trunkBaseY + 95, w: 11 }
      ];
      roots.forEach(function(r) {
        var rp = buildBranchPath(r.x1, r.y1, r.x2, r.y2, 0.3);
        svgParts.push('<path d="' + rp + '" stroke="#3A2110" stroke-width="' + r.w + '" fill="none" stroke-linecap="round" opacity="0.88" />');
      });

      // ---- 树干 ----
      var trunkPath = 'M ' + (cx - 65) + ' ' + (trunkBaseY + 5) +
        ' C ' + (cx - 88) + ' ' + (trunkBaseY - 80) + ', ' + (cx - 62) + ' ' + (trunkBaseY - 200) + ', ' + (cx - 48) + ' ' + (trunkTop + 90) +
        ' C ' + (cx - 44) + ' ' + (trunkTop + 40) + ', ' + (cx - 36) + ' ' + (trunkTop + 12) + ', ' + (cx - 28) + ' ' + trunkTop +
        ' L ' + (cx + 28) + ' ' + trunkTop +
        ' C ' + (cx + 36) + ' ' + (trunkTop + 12) + ', ' + (cx + 44) + ' ' + (trunkTop + 40) + ', ' + (cx + 48) + ' ' + (trunkTop + 90) +
        ' C ' + (cx + 62) + ' ' + (trunkBaseY - 200) + ', ' + (cx + 92) + ' ' + (trunkBaseY - 80) + ', ' + (cx + 65) + ' ' + (trunkBaseY + 5) + ' Z';
      svgParts.push('<path d="' + trunkPath + '" fill="url(#trunkGrad)" />');
      svgParts.push('<path d="' + trunkPath + '" fill="url(#trunkHi)" />');
      for (var tti = 0; tti < 24; tti++) {
        var ttx = cx + (Math.random() - 0.5) * 100;
        var tty = trunkTop + 30 + Math.random() * (trunkBaseY - trunkTop - 50);
        var ttw = 4 + Math.random() * 10;
        var tth = 12 + Math.random() * 22;
        svgParts.push('<ellipse cx="' + ttx + '" cy="' + tty + '" rx="' + (ttw/2) + '" ry="' + (tth/2) + '" fill="rgba(0,0,0,0.35)" />');
      }
      svgParts.push('<path d="M ' + (cx - 6) + ' ' + (trunkTop + 50) + ' Q ' + (cx + 4) + ' ' + ((trunkTop + trunkBaseY) / 2) + ' ' + (cx - 2) + ' ' + (trunkBaseY - 30) + '" stroke="rgba(0,0,0,0.5)" stroke-width="1.8" fill="none" />');
      svgParts.push('<path d="M ' + (cx + 14) + ' ' + (trunkTop + 70) + ' Q ' + (cx + 16) + ' ' + ((trunkTop + trunkBaseY) / 2 + 50) + ', ' + (cx + 14) + ' ' + (trunkBaseY - 50) + '" stroke="rgba(255,200,140,0.14)" stroke-width="1.3" fill="none" />');
      svgParts.push('<ellipse cx="' + (cx - 32) + '" cy="' + (trunkBaseY - 100) + '" rx="10" ry="13" fill="rgba(0,0,0,0.45)" />');
      svgParts.push('<ellipse cx="' + (cx - 32) + '" cy="' + (trunkBaseY - 100) + '" rx="6" ry="8" fill="rgba(255,200,140,0.12)" />');
      svgParts.push('<ellipse cx="' + (cx + 38) + '" cy="' + (trunkBaseY - 200) + '" rx="8" ry="10" fill="rgba(0,0,0,0.4)" />');

      // ---- 后层枝条 ----
      svgParts.push('<g class="branch-layer branch-layer--far">');
      allBranches.filter(function(b) { return b.layer === 'far'; }).forEach(function(b) {
        svgParts.push('  <path d="' + b.path + '" stroke="#1F1208" stroke-width="' + (b.width * 0.55).toFixed(1) + '" fill="none" stroke-linecap="round" opacity="0.55" />');
      });
      svgParts.push('</g>');

      // ---- 中层枝条 ----
      svgParts.push('<g class="branch-layer branch-layer--mid">');
      allBranches.filter(function(b) { return b.layer === 'mid'; }).forEach(function(b) {
        var stroke = b.depth === 0 ? '#5A331B' : '#6B3D1F';
        svgParts.push('  <path d="' + b.path + '" stroke="' + stroke + '" stroke-width="' + (b.width * 0.78).toFixed(1) + '" fill="none" stroke-linecap="round" opacity="0.78" />');
      });
      svgParts.push('</g>');

      // ---- 前层枝条 ----
      svgParts.push('<g class="branch-layer branch-layer--near">');
      allBranches.filter(function(b) { return b.layer === 'near'; }).forEach(function(b) {
        var stroke = b.depth === 0 ? '#7A4A26' : '#5A331B';
        svgParts.push('  <path d="' + b.path + '" stroke="' + stroke + '" stroke-width="' + b.width.toFixed(1) + '" fill="none" stroke-linecap="round" />');
      });
      svgParts.push('</g>');

      // 9. 为每个 idea 生成对话气泡
      // 气泡形状生成函数 - 尾巴方向随机，更自然
      function makeBubblePath(shape, w, h, tailAngle) {
        var hw = w / 2, hh = h / 2;
        // 尾巴长度和角度随机
        var tailLen = 8 + Math.random() * 8;
        var tailSpread = 0.3 + Math.random() * 0.4;
        
        // 根据尾巴角度计算尾巴终点
        var tailEndX = Math.cos(tailAngle) * (Math.min(hw, hh) + tailLen);
        var tailEndY = Math.sin(tailAngle) * (Math.min(hw, hh) + tailLen);
        var tailBaseX = Math.cos(tailAngle) * Math.min(hw, hh) * 0.85;
        var tailBaseY = Math.sin(tailAngle) * Math.min(hw, hh) * 0.85;
        
        // 尾巴两侧控制点
        var tailAngle1 = tailAngle - tailSpread;
        var tailAngle2 = tailAngle + tailSpread;
        var tailMidX = Math.cos(tailAngle) * (Math.min(hw, hh) + tailLen * 0.6);
        var tailMidY = Math.sin(tailAngle) * (Math.min(hw, hh) + tailLen * 0.6);
        
        switch (shape) {
          case 'ellipse':
            // 椭圆气泡 + 自然尾巴
            return 'M ' + (-hw) + ' 0' +
              ' A ' + hw + ' ' + hh + ' 0 1 1 ' + hw + ' 0' +
              ' A ' + hw + ' ' + hh + ' 0 1 1 ' + (-hw) + ' 0 Z' +
              ' M ' + tailBaseX.toFixed(1) + ' ' + tailBaseY.toFixed(1) +
              ' Q ' + tailMidX.toFixed(1) + ' ' + tailMidY.toFixed(1) + ' ' + tailEndX.toFixed(1) + ' ' + tailEndY.toFixed(1) +
              ' Q ' + (tailMidX - Math.cos(tailAngle2) * 3).toFixed(1) + ' ' + (tailMidY - Math.sin(tailAngle2) * 3).toFixed(1) + ' ' + (tailBaseX - Math.cos(tailAngle1) * 2).toFixed(1) + ' ' + (tailBaseY - Math.sin(tailAngle1) * 2).toFixed(1);
          case 'roundedRect':
            var r = Math.min(hw, hh) * 0.35;
            return 'M ' + (-hw + r) + ' ' + (-hh) +
              ' L ' + (hw - r) + ' ' + (-hh) +
              ' A ' + r + ' ' + r + ' 0 0 1 ' + hw + ' ' + (-hh + r) +
              ' L ' + hw + ' ' + (hh - r) +
              ' A ' + r + ' ' + r + ' 0 0 1 ' + (hw - r) + ' ' + hh +
              ' L ' + (-hw + r) + ' ' + hh +
              ' A ' + r + ' ' + r + ' 0 0 1 ' + (-hw) + ' ' + (hh - r) +
              ' L ' + (-hw) + ' ' + (-hh + r) +
              ' A ' + r + ' ' + r + ' 0 0 1 ' + (-hw + r) + ' ' + (-hh) + ' Z' +
              ' M ' + tailBaseX.toFixed(1) + ' ' + tailBaseY.toFixed(1) +
              ' Q ' + tailMidX.toFixed(1) + ' ' + tailMidY.toFixed(1) + ' ' + tailEndX.toFixed(1) + ' ' + tailEndY.toFixed(1) +
              ' Q ' + (tailMidX - Math.cos(tailAngle2) * 3).toFixed(1) + ' ' + (tailMidY - Math.sin(tailAngle2) * 3).toFixed(1) + ' ' + (tailBaseX - Math.cos(tailAngle1) * 2).toFixed(1) + ' ' + (tailBaseY - Math.sin(tailAngle1) * 2).toFixed(1);
          case 'cloud':
            // 云朵形状（多个圆弧拼接）
            var cr = Math.min(hw, hh) * 0.45;
            return 'M ' + (-hw + cr * 0.5) + ' ' + (hh * 0.3) +
              ' A ' + cr + ' ' + cr + ' 0 0 1 ' + (-hw + cr * 0.3) + ' ' + (-hh * 0.4) +
              ' A ' + (cr * 1.1) + ' ' + (cr * 1.1) + ' 0 0 1 ' + (hw * 0.1) + ' ' + (-hh - cr * 0.3) +
              ' A ' + (cr * 0.9) + ' ' + (cr * 0.9) + ' 0 0 1 ' + (hw - cr * 0.2) + ' ' + (-hh * 0.5) +
              ' A ' + cr + ' ' + cr + ' 0 0 1 ' + (hw + cr * 0.3) + ' ' + (hh * 0.2) +
              ' A ' + (cr * 0.8) + ' ' + (cr * 0.8) + ' 0 0 1 ' + (hw * 0.5) + ' ' + (hh + cr * 0.2) +
              ' A ' + (cr * 0.7) + ' ' + (cr * 0.7) + ' 0 0 1 ' + (-hw * 0.3) + ' ' + (hh + cr * 0.15) +
              ' A ' + (cr * 0.9) + ' ' + (cr * 0.9) + ' 0 0 1 ' + (-hw + cr * 0.5) + ' ' + (hh * 0.3) + ' Z' +
              ' M ' + tailBaseX.toFixed(1) + ' ' + tailBaseY.toFixed(1) +
              ' Q ' + tailMidX.toFixed(1) + ' ' + tailMidY.toFixed(1) + ' ' + tailEndX.toFixed(1) + ' ' + tailEndY.toFixed(1) +
              ' Q ' + (tailMidX - Math.cos(tailAngle2) * 3).toFixed(1) + ' ' + (tailMidY - Math.sin(tailAngle2) * 3).toFixed(1) + ' ' + (tailBaseX - Math.cos(tailAngle1) * 2).toFixed(1) + ' ' + (tailBaseY - Math.sin(tailAngle1) * 2).toFixed(1);
          case 'starBurst':
            // 星形爆炸气泡
            var pts = 8;
            var outerR = Math.min(hw, hh);
            var innerR = outerR * 0.6;
            var d = '';
            for (var si = 0; si < pts * 2; si++) {
              var sa = (si / (pts * 2)) * Math.PI * 2 - Math.PI / 2;
              var sr = si % 2 === 0 ? outerR : innerR;
              var sx = Math.cos(sa) * sr;
              var sy = Math.sin(sa) * sr;
              d += (si === 0 ? 'M ' : ' L ') + sx.toFixed(1) + ' ' + sy.toFixed(1);
            }
            d += ' Z';
            // 小尾巴
            d += ' M ' + tailBaseX.toFixed(1) + ' ' + tailBaseY.toFixed(1) +
              ' Q ' + tailMidX.toFixed(1) + ' ' + tailMidY.toFixed(1) + ' ' + tailEndX.toFixed(1) + ' ' + tailEndY.toFixed(1) +
              ' Q ' + (tailMidX - Math.cos(tailAngle2) * 3).toFixed(1) + ' ' + (tailMidY - Math.sin(tailAngle2) * 3).toFixed(1) + ' ' + (tailBaseX - Math.cos(tailAngle1) * 2).toFixed(1) + ' ' + (tailBaseY - Math.sin(tailAngle1) * 2).toFixed(1);
            return d;
          case 'circle':
            var cr2 = Math.min(hw, hh);
            return 'M ' + 0 + ' ' + (-cr2) +
              ' A ' + cr2 + ' ' + cr2 + ' 0 1 1 ' + 0 + ' ' + cr2 +
              ' A ' + cr2 + ' ' + cr2 + ' 0 1 1 ' + 0 + ' ' + (-cr2) + ' Z' +
              ' M ' + tailBaseX.toFixed(1) + ' ' + tailBaseY.toFixed(1) +
              ' Q ' + tailMidX.toFixed(1) + ' ' + tailMidY.toFixed(1) + ' ' + tailEndX.toFixed(1) + ' ' + tailEndY.toFixed(1) +
              ' Q ' + (tailMidX - Math.cos(tailAngle2) * 3).toFixed(1) + ' ' + (tailMidY - Math.sin(tailAngle2) * 3).toFixed(1) + ' ' + (tailBaseX - Math.cos(tailAngle1) * 2).toFixed(1) + ' ' + (tailBaseY - Math.sin(tailAngle1) * 2).toFixed(1);
          case 'smallDot':
            var dr = Math.min(hw, hh) * 0.7;
            return 'M ' + 0 + ' ' + (-dr) +
              ' A ' + dr + ' ' + dr + ' 0 1 1 ' + 0 + ' ' + dr +
              ' A ' + dr + ' ' + dr + ' 0 1 1 ' + 0 + ' ' + (-dr) + ' Z';
          default:
            return 'M ' + (-hw) + ' ' + (-hh) + ' L ' + hw + ' ' + (-hh) + ' L ' + hw + ' ' + hh + ' L ' + (-hw) + ' ' + hh + ' Z';
        }
      }

      var farBubbles = [];
      var midBubbles = [];
      var nearBubbles = [];

      shuffled.forEach(function(idea, idx) {
        if (idx >= usedSpots.length) return;
        var cat = getCategoryFromIdea(idea);
        var spot = usedSpots[idx];
        var color = bubbleColors[cat] || bubbleColors.user;
        var layer = spot.layer;
        var finalLayer = layer;
        if (layer === 'near' && Math.random() < 0.2) finalLayer = 'mid';
        if (layer === 'mid' && Math.random() < 0.15) finalLayer = 'far';

        // 气泡尺寸（根据层级和随机）
        var baseScale = finalLayer === 'far' ? 0.55 : finalLayer === 'mid' ? 0.78 : 1.0;
        var sizeVar = 0.7 + Math.random() * 0.6; // 0.7 ~ 1.3
        var bubbleW = (36 + Math.random() * 50) * sizeVar * baseScale;  // 36~86
        var bubbleH = (28 + Math.random() * 36) * sizeVar * baseScale;  // 28~64

        // 气泡形状（小尺寸更倾向圆点/小圆）
        var shape;
        if (bubbleW < 30) {
          shape = 'smallDot';
        } else {
          // 按分类偏好形状
          var shapeRoll = Math.random();
          if (cat === 'system') {
            shape = shapeRoll < 0.35 ? 'ellipse' : shapeRoll < 0.6 ? 'roundedRect' : shapeRoll < 0.8 ? 'starBurst' : 'cloud';
          } else if (cat === 'hot') {
            shape = shapeRoll < 0.3 ? 'roundedRect' : shapeRoll < 0.55 ? 'ellipse' : shapeRoll < 0.8 ? 'starBurst' : 'circle';
          } else if (cat === 'user') {
            shape = shapeRoll < 0.3 ? 'cloud' : shapeRoll < 0.55 ? 'ellipse' : shapeRoll < 0.8 ? 'roundedRect' : 'circle';
          } else {
            shape = shapeRoll < 0.3 ? 'circle' : shapeRoll < 0.55 ? 'smallDot' : shapeRoll < 0.8 ? 'ellipse' : 'roundedRect';
          }
        }

        // 计算尾巴角度：指向树枝方向（从气泡指向挂点的反方向）
        var tailAngle = spot.parentAngle + Math.PI + (Math.random() - 0.5) * 0.6;
        
        var bubblePath = makeBubblePath(shape, bubbleW, bubbleH, tailAngle);

        // 位置：挂在树枝挂点附近，稍微偏移
        var offsetX = (Math.random() - 0.5) * 30;
        var offsetY = (Math.random() - 0.5) * 20;
        var bx = spot.x + offsetX;
        var by = spot.y + offsetY;

        // 轻微旋转（让气泡更自然）
        var rot = (Math.random() - 0.5) * 15;

        var opacity = finalLayer === 'far' ? 0.55 : finalLayer === 'mid' ? 0.82 : 1.0;
        var filterAttr = finalLayer === 'far' ? ' filter="url(#bubbleFar)"' : ' filter="url(#bubbleShadow)"';
        var layerClass = 'idea-bubble idea-bubble--' + finalLayer;

        // 气泡内的文字（短标题）
        var rawTitle = String(idea.title || '');
        var shortTitle = rawTitle.length > 5 ? rawTitle.substring(0, 5) : rawTitle;
        var fontSize = Math.max(9, Math.min(13, bubbleW * 0.22));

        var onclickAttr = ' onclick="window.openIdeaTag(\'' + esc(idea.title) + '\',\'' + esc(idea.content || '') + '\',' + (cat === 'system' ? 'true' : 'false') + ',\'' + esc(idea.id) + '\')"';

        var bubble = '<g class="' + layerClass + '" data-cat="' + cat + '"' +
          ' transform="translate(' + bx.toFixed(1) + ',' + by.toFixed(1) + ') rotate(' + rot.toFixed(1) + ')"' +
          ' style="opacity:' + opacity + '"' + onclickAttr + filterAttr + '>' +
          '<path d="' + bubblePath + '" fill="' + color.fill + '" stroke="' + color.stroke + '" stroke-width="1.2" />' +
          (shortTitle ? '<text x="0" y="' + (fontSize * 0.35) + '" text-anchor="middle" font-size="' + fontSize.toFixed(1) + '" font-weight="700" fill="' + color.text + '" style="pointer-events:none; font-family: inherit">' + esc(shortTitle) + '</text>' : '') +
          '</g>';

        if (finalLayer === 'far') farBubbles.push(bubble);
        else if (finalLayer === 'mid') midBubbles.push(bubble);
        else nearBubbles.push(bubble);
      });

      // 渲染气泡（远→中→近）
      svgParts.push('<g class="bubble-layer bubble-layer--far">');
      farBubbles.forEach(function(b) { svgParts.push('  ' + b); });
      svgParts.push('</g>');

      svgParts.push('<g class="bubble-layer bubble-layer--mid">');
      midBubbles.forEach(function(b) { svgParts.push('  ' + b); });
      svgParts.push('</g>');

      svgParts.push('<g class="bubble-layer bubble-layer--near">');
      nearBubbles.forEach(function(b) { svgParts.push('  ' + b); });
      svgParts.push('</g>');

      svgParts.push('</svg>');

      container.innerHTML = svgParts.join('');

      // 15. 统计
      var statsEl = document.getElementById('ideaStats');
      if (statsEl) {
        var showCount = filtered.length;
        var totalCount = list.length;
        var catLabel = currentIdeaCategory === 'all' ? '全部' :
                       currentIdeaCategory === 'system' ? '系统精选' :
                       currentIdeaCategory === 'hot' ? '热门项目' :
                       currentIdeaCategory === 'user' ? '客户发起' : '最新创意';
        statsEl.innerHTML = '<span>🌳 创意树上挂着 <strong style="color:#fff">' + showCount + '</strong> 条创意 / 共 ' + totalCount + ' 条</span>' +
          '<span style="color:rgba(255,255,255,0.4)">分类: ' + catLabel + '</span>' +
          '<span style="color:rgba(255,255,255,0.4)">' +
            '<span style="color:#FF6B6B">●</span> ' + cats.system + ' 精选 · ' +
            '<span style="color:#FFB066">●</span> ' + cats.hot + ' 热门 · ' +
            '<span style="color:#7DDFA0">●</span> ' + cats.user + ' 发起 · ' +
            '<span style="color:#7FB8FF">●</span> ' + cats.fresh + ' 最新' +
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
