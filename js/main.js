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
        if (p.statusClass === 'reserved') statusClass += ' project-card__status--reserved';

        var qr1Html = renderQr(p.qrcode, '项目码', p.name);
        var qr2Html = renderQr(p.qrcode2, '交流群', p.name);

        var linkBtnHtml = p.link ?
          '<a href="' + escapeHtml(p.link) + '" class="project-card__btn project-card__btn--primary" target="_blank" rel="noopener">' +
            '<span>项目简介</span>' +
          '</a>' : '';

        var contactBtnHtml = p.contact ?
          '<button class="project-card__btn project-card__btn--secondary" data-contact="' + escapeHtml(p.contact) + '">' +
            '<span>参与项目</span>' +
          '</button>' : '';

        var actionsHtml = (linkBtnHtml || contactBtnHtml) ?
          '<div class="project-card__actions">' + linkBtnHtml + contactBtnHtml + '</div>' : '';

        return '<article class="project-card' + reservedClass + '" data-id="' + p.id + '">' +
          '<span class="' + statusClass + '">' + escapeHtml(p.status || '推广中') + '</span>' +
          '<h3 class="project-card__name">' + escapeHtml(p.name) + '</h3>' +
          '<p class="project-card__desc">' + escapeHtml(p.desc) + '</p>' +
          '<div class="project-card__qr-wrap">' + qr1Html + qr2Html + '</div>' +
          actionsHtml +
        '</article>';
      }).join('');

      grid.querySelectorAll('[data-contact]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var contact = this.getAttribute('data-contact');
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(contact).then(function () {
              alert('发起人联系方式已复制：' + contact);
            }).catch(function () {
              prompt('发起人联系方式：', contact);
            });
          } else {
            prompt('发起人联系方式：', contact);
          }
        });
      });
    }

    function createAdminUI() {
      var wrapper = document.createElement('div');
      wrapper.id = 'projectAdminWrapper';
      wrapper.innerHTML =
        '<div class="admin-overlay" id="adminOverlay">' +
          '<div class="admin-modal" id="adminLoginModal">' +
            '<h3 class="admin-modal__title">项目管理登录</h3>' +
            '<input type="password" class="admin-input" id="adminPassword" placeholder="请输入管理密码" autocomplete="off">' +
            '<div class="admin-actions">' +
              '<button class="admin-btn admin-btn--secondary" id="adminLoginCancel">取消</button>' +
              '<button class="admin-btn admin-btn--primary" id="adminLoginConfirm">确认</button>' +
            '</div>' +
          '</div>' +
          '<div class="admin-modal admin-modal--wide" id="adminPanelModal" style="display:none;">' +
            '<div class="admin-tabs">' +
              '<button class="admin-tab active" data-tab="projects">项目管理</button>' +
              '<button class="admin-tab" data-tab="faq">FAQ设置</button>' +
              '<button class="admin-tab" data-tab="submissions">提交审核</button>' +
            '</div>' +

            '<!-- 项目管理面板 -->' +
            '<div class="admin-tab-content active" id="tabProjects">' +
              '<div class="admin-panel-body">' +
                '<div class="admin-panel-col">' +
                  '<h4 class="admin-form__title">现有项目</h4>' +
                  '<div class="admin-project-list" id="adminProjectList"></div>' +
                '</div>' +
                '<div class="admin-panel-col">' +
                  '<h4 class="admin-form__title" id="projectFormTitle">添加新项目</h4>' +
                  '<div class="admin-form">' +
                    '<input type="text" class="admin-input" id="adminInputName" placeholder="项目名称">' +
                    '<textarea class="admin-input admin-input--area" id="adminInputDesc" placeholder="项目概述" rows="2"></textarea>' +
                    '<input type="text" class="admin-input" id="adminInputLink" placeholder="项目落地页链接">' +
                    '<input type="text" class="admin-input" id="adminInputContact" placeholder="参与项目联系方式（微信号/手机号）">' +
                    '<label class="admin-file">' +
                      '<input type="file" class="admin-file__input" id="adminInputQr" accept="image/*">' +
                      '<span class="admin-file__btn">上传项目码</span>' +
                      '<span class="admin-file__name" id="adminFileName">小程序码 / 落地页码</span>' +
                    '</label>' +
                    '<div class="admin-qr-preview" id="adminQrPreview"></div>' +
                    '<label class="admin-file">' +
                      '<input type="file" class="admin-file__input" id="adminInputQr2" accept="image/*">' +
                      '<span class="admin-file__btn">上传交流群码</span>' +
                      '<span class="admin-file__name" id="adminFileName2">项目交流群二维码</span>' +
                    '</label>' +
                    '<div class="admin-qr-preview" id="adminQrPreview2"></div>' +
                    '<select class="admin-input" id="adminInputStatus">' +
                      '<option value="">推广阶段</option>' +
                      '<option value="pre">初期预热</option>' +
                      '<option value="reserved">预留点位</option>' +
                    '</select>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="admin-actions">' +
                '<button class="admin-btn admin-btn--secondary" id="adminPanelClose">关闭</button>' +
                '<button class="admin-btn admin-btn--primary" id="adminAddProject">添加项目</button>' +
              '</div>' +
            '</div>' +

            '<!-- FAQ设置面板 -->' +
            '<div class="admin-tab-content" id="tabFaq" style="display:none;">' +
              '<div class="admin-faq-section">' +
                '<h4 class="admin-form__title">FAQ 区域二维码</h4>' +
                '<p class="admin-faq-hint">上传后将在 FAQ 区域显示，引导用户扫码加入社群或获取更多信息</p>' +
                '<div class="admin-faq-qrs">' +
                  '<div class="admin-faq-qr-item">' +
                    '<label class="admin-file">' +
                      '<input type="file" class="admin-file__input" id="adminFaqQr1" accept="image/*">' +
                      '<span class="admin-file__btn">上传二维码1</span>' +
                      '<span class="admin-file__name" id="adminFaqName1">社群入群码</span>' +
                    '</label>' +
                    '<div class="admin-qr-preview" id="adminFaqPreview1"></div>' +
                    '<input type="text" class="admin-input" id="adminFaqLabel1" placeholder="二维码标签（如：扫码进群）">' +
                  '</div>' +
                  '<div class="admin-faq-qr-item">' +
                    '<label class="admin-file">' +
                      '<input type="file" class="admin-file__input" id="adminFaqQr2" accept="image/*">' +
                      '<span class="admin-file__btn">上传二维码2</span>' +
                      '<span class="admin-file__name" id="adminFaqName2">创始人微信</span>' +
                    '</label>' +
                    '<div class="admin-qr-preview" id="adminFaqPreview2"></div>' +
                    '<input type="text" class="admin-input" id="adminFaqLabel2" placeholder="二维码标签（如：联系创始人）">' +
                  '</div>' +
                '</div>' +
                '<div class="admin-actions">' +
                  '<button class="admin-btn admin-btn--primary" id="adminSaveFaq">保存FAQ设置</button>' +
                '</div>' +
              '</div>' +
            '</div>' +

            '<!-- 提交审核面板 -->' +
            '<div class="admin-tab-content" id="tabSubmissions" style="display:none;">' +
              '<div class="admin-section">' +
                '<h4 class="admin-form__title">待审核的项目点子</h4>' +
                '<div class="admin-submissions-list" id="adminSubmissionsList">' +
                  '<p style="color:var(--c-white-40);font-size:0.9rem;text-align:center;padding:24px;">暂无待审核的提交</p>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
      document.body.appendChild(wrapper);

      var trigger = document.getElementById('adminTrigger');
      var overlay = document.getElementById('adminOverlay');
      var loginModal = document.getElementById('adminLoginModal');
      var panelModal = document.getElementById('adminPanelModal');
      var passwordInput = document.getElementById('adminPassword');
      var loginConfirm = document.getElementById('adminLoginConfirm');
      var loginCancel = document.getElementById('adminLoginCancel');
      var panelClose = document.getElementById('adminPanelClose');
      var addBtn = document.getElementById('adminAddProject');
      var projectList = document.getElementById('adminProjectList');

      var pendingQr = '';
      var pendingQr2 = '';

      function openOverlay() { overlay.classList.add('is-visible'); }
      function closeOverlay() {
        overlay.classList.remove('is-visible');
        passwordInput.value = '';
        panelModal.style.display = 'none';
        loginModal.style.display = '';
      }

      function resetForm() {
        clearEditMode();
        document.getElementById('adminInputName').value = '';
        document.getElementById('adminInputDesc').value = '';
        document.getElementById('adminInputLink').value = '';
        document.getElementById('adminInputContact').value = '';
        document.getElementById('adminInputStatus').value = '';

        document.getElementById('adminInputQr').value = '';
        document.getElementById('adminQrPreview').innerHTML = '';
        document.getElementById('adminFileName').textContent = '小程序码 / 落地页码';
        pendingQr = '';

        document.getElementById('adminInputQr2').value = '';
        document.getElementById('adminQrPreview2').innerHTML = '';
        document.getElementById('adminFileName2').textContent = '项目交流群二维码';
        pendingQr2 = '';
      }

      function bindQrUpload(inputId, previewId, nameId, pendingRef) {
        var input = document.getElementById(inputId);
        var preview = document.getElementById(previewId);
        var fileName = document.getElementById(nameId);

        input.addEventListener('change', function () {
          var file = input.files && input.files[0];
          if (!file) return;

          if (file.size > 2 * 1024 * 1024) {
            fileName.textContent = '图片过大，请压缩至 2MB 以内';
            fileName.style.color = '#ef4444';
            input.value = '';
            return;
          }

          fileName.textContent = file.name;
          fileName.style.color = '';

          var reader = new FileReader();
          reader.onload = function (e) {
            var dataUrl = e.target.result;
            if (pendingRef === 'qr1') pendingQr = dataUrl;
            else pendingQr2 = dataUrl;

            var clearId = 'adminClear' + pendingRef;
            preview.innerHTML = '<img src="' + dataUrl + '" alt="二维码预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="' + clearId + '">清除</button>';
            document.getElementById(clearId).addEventListener('click', function () {
              input.value = '';
              preview.innerHTML = '';
              fileName.textContent = pendingRef === 'qr1' ? '小程序码 / 落地页码' : '项目交流群二维码';
              if (pendingRef === 'qr1') pendingQr = '';
              else pendingQr2 = '';
            });
          };
          reader.readAsDataURL(file);
        });
      }

      bindQrUpload('adminInputQr', 'adminQrPreview', 'adminFileName', 'qr1');
      bindQrUpload('adminInputQr2', 'adminQrPreview2', 'adminFileName2', 'qr2');

      function renderAdminList() {
        var list = getProjects();
        projectList.innerHTML = list.map(function (p, idx) {
          var qrInfo = [];
          if (p.qrcode) qrInfo.push('项目码');
          if (p.qrcode2) qrInfo.push('交流群码');
          return '<div class="admin-project-item">' +
            '<div>' +
              '<strong>' + escapeHtml(p.name) + '</strong>' +
              '<span class="admin-project-status">' + escapeHtml(p.status || '推广中') + ' · ' + (qrInfo.length ? qrInfo.join(' / ') : '无二维码') + '</span>' +
            '</div>' +
            '<div class="admin-project-actions">' +
              '<button class="admin-btn admin-btn--small" data-move-up="' + p.id + '">↑</button>' +
              '<button class="admin-btn admin-btn--small" data-move-dn="' + p.id + '">↓</button>' +
              '<button class="admin-btn admin-btn--secondary admin-btn--small" data-edit="' + p.id + '">编辑</button>' +
              '<button class="admin-btn admin-btn--danger admin-btn--small" data-del="' + p.id + '">删除</button>' +
            '</div>' +
          '</div>';
        }).join('');

        // 上移
        projectList.querySelectorAll('[data-move-up]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-move-up');
            var items = getProjects();
            var idx = -1;
            for (var i = 0; i < items.length; i++) {
              if (items[i].id === id) { idx = i; break; }
            }
            if (idx > 0) {
              var tmp = items[idx - 1];
              items[idx - 1] = items[idx];
              items[idx] = tmp;
              saveProjects(items);
              renderProjects();
              renderAdminList();
            }
          });
        });

        // 下移
        projectList.querySelectorAll('[data-move-dn]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-move-dn');
            var items = getProjects();
            var idx = -1;
            for (var i = 0; i < items.length; i++) {
              if (items[i].id === id) { idx = i; break; }
            }
            if (idx < items.length - 1) {
              var tmp = items[idx + 1];
              items[idx + 1] = items[idx];
              items[idx] = tmp;
              saveProjects(items);
              renderProjects();
              renderAdminList();
            }
          });
        });

        projectList.querySelectorAll('[data-edit]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-edit');
            loadProjectToForm(id);
          });
        });

        projectList.querySelectorAll('[data-del]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            var id = this.getAttribute('data-del');
            var next = list.filter(function (x) { return x.id !== id; });
            saveProjects(next);
            renderProjects();
            renderAdminList();
            clearEditMode();
          });
        });
      }

      var editingId = null;

      function loadProjectToForm(id) {
        var list = getProjects();
        var p = list.find(function (x) { return x.id === id; });
        if (!p) return;
        editingId = id;

        document.getElementById('adminInputName').value = p.name || '';
        document.getElementById('adminInputDesc').value = p.desc || '';
        document.getElementById('adminInputLink').value = p.link || '';
        document.getElementById('adminInputContact').value = p.contact || '';
        document.getElementById('adminInputStatus').value = p.statusClass || '';

        pendingQr = p.qrcode || '';
        pendingQr2 = p.qrcode2 || '';

        if (pendingQr) {
          document.getElementById('adminQrPreview').innerHTML =
            '<img src="' + pendingQr + '" alt="预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="adminClearQr">清除</button>';
          bindClearBtn('adminClearQr', 'qr1');
          document.getElementById('adminFileName').textContent = '已上传';
        }
        if (pendingQr2) {
          document.getElementById('adminQrPreview2').innerHTML =
            '<img src="' + pendingQr2 + '" alt="预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="adminClearQr2">清除</button>';
          bindClearBtn('adminClearQr2', 'qr2');
          document.getElementById('adminFileName2').textContent = '已上传';
        }

        addBtn.textContent = '保存修改';
        addBtn.classList.add('is-editing');
      }

      function bindClearBtn(clearId, ref) {
        var el = document.getElementById(clearId);
        if (!el) return;
        el.addEventListener('click', function () {
          if (ref === 'qr1') {
            document.getElementById('adminInputQr').value = '';
            document.getElementById('adminQrPreview').innerHTML = '';
            document.getElementById('adminFileName').textContent = '小程序码 / 落地页码';
            pendingQr = '';
          } else {
            document.getElementById('adminInputQr2').value = '';
            document.getElementById('adminQrPreview2').innerHTML = '';
            document.getElementById('adminFileName2').textContent = '项目交流群二维码';
            pendingQr2 = '';
          }
        });
      }

      function clearEditMode() {
        editingId = null;
        addBtn.textContent = '添加项目';
        addBtn.classList.remove('is-editing');
      }

      function showPanel() {
        loginModal.style.display = 'none';
        panelModal.style.display = '';
        renderAdminList();
        document.getElementById('adminInputName').focus();
      }

      trigger.addEventListener('click', openOverlay);
      loginCancel.addEventListener('click', closeOverlay);
      panelClose.addEventListener('click', closeOverlay);
      overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeOverlay();
      });

      loginConfirm.addEventListener('click', function () {
        _checkPassword(passwordInput.value).then(function (match) {
          if (match) {
            showPanel();
          } else {
            passwordInput.classList.add('is-error');
            setTimeout(function () { passwordInput.classList.remove('is-error'); }, 600);
          }
        });
      });

      passwordInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') loginConfirm.click();
      });

      addBtn.addEventListener('click', function () {
        var nameEl = document.getElementById('adminInputName');
        var descEl = document.getElementById('adminInputDesc');
        var linkEl = document.getElementById('adminInputLink');
        var contactEl = document.getElementById('adminInputContact');
        var statusEl = document.getElementById('adminInputStatus');

        var name = nameEl.value.trim();
        var desc = descEl.value.trim();
        var link = linkEl.value.trim();
        var contact = contactEl.value.trim();
        var statusClass = statusEl.value;

        if (!name || !desc) {
          if (!name) nameEl.classList.add('is-error');
          if (!desc) descEl.classList.add('is-error');
          setTimeout(function () {
            nameEl.classList.remove('is-error');
            descEl.classList.remove('is-error');
          }, 600);
          return;
        }

        var statusMap = { '': '推广阶段', 'pre': '初期预热', 'reserved': '预留点位' };
        var list = getProjects();

        if (editingId) {
          // 编辑模式：更新已有项目
          for (var i = 0; i < list.length; i++) {
            if (list[i].id === editingId) {
              list[i].name = name;
              list[i].desc = desc;
              list[i].link = link;
              list[i].contact = contact;
              list[i].qrcode = pendingQr;
              list[i].qrcode2 = pendingQr2;
              list[i].status = statusMap[statusClass] || '推广阶段';
              list[i].statusClass = statusClass;
              break;
            }
          }
          clearEditMode();
        } else {
          // 新增模式
          list.push({
            id: 'p' + Date.now(),
            name: name,
            desc: desc,
            link: link,
            contact: contact,
            qrcode: pendingQr,
            qrcode2: pendingQr2,
            status: statusMap[statusClass] || '推广阶段',
            statusClass: statusClass
          });
        }
        saveProjects(list);
        renderProjects();
        renderAdminList();
        resetForm();
      });

      // ========== Tab 切换 ==========
      wrapper.querySelectorAll('.admin-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
          var target = this.getAttribute('data-tab');
          wrapper.querySelectorAll('.admin-tab').forEach(function (t) { t.classList.remove('active'); });
          this.classList.add('active');
          wrapper.querySelectorAll('.admin-tab-content').forEach(function (c) { c.style.display = 'none'; });
          var contentEl = document.getElementById('tab' + target.charAt(0).toUpperCase() + target.slice(1));
          if (contentEl) contentEl.style.display = 'block';
          if (target === 'faq') loadFaqSettings();
          if (target === 'submissions' && window.renderSubmissions) window.renderSubmissions();
        });
      });

      // ========== FAQ 二维码管理 ==========
      var FAQ_KEY = 'tcai_faq_qr_v1';
      var faqPendingQr1 = '';
      var faqPendingQr2 = '';

      function loadFaqSettings() {
        try {
          var raw = localStorage.getItem(FAQ_KEY);
          if (!raw) return;
          var data = JSON.parse(raw);
          if (data.qr1) {
            faqPendingQr1 = data.qr1;
            document.getElementById('adminFaqPreview1').innerHTML =
              '<img src="' + data.qr1 + '" alt="预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="adminClearFaq1">清除</button>';
            document.getElementById('adminFaqName1').textContent = '已上传';
            document.getElementById('adminFaqLabel1').value = data.label1 || '';
            bindFaqClearBtn('adminClearFaq1', 1);
          }
          if (data.qr2) {
            faqPendingQr2 = data.qr2;
            document.getElementById('adminFaqPreview2').innerHTML =
              '<img src="' + data.qr2 + '" alt="预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="adminClearFaq2">清除</button>';
            document.getElementById('adminFaqName2').textContent = '已上传';
            document.getElementById('adminFaqLabel2').value = data.label2 || '';
            bindFaqClearBtn('adminClearFaq2', 2);
          }
        } catch (e) {}
      }

      function bindFaqUpload(inputId, previewId, nameId, num) {
        var input = document.getElementById(inputId);
        var preview = document.getElementById(previewId);
        var fileName = document.getElementById(nameId);

        input.addEventListener('change', function () {
          var file = input.files && input.files[0];
          if (!file) return;
          if (file.size > 2 * 1024 * 1024) {
            fileName.textContent = '图片过大';
            fileName.style.color = '#ef4444';
            input.value = '';
            return;
          }
          fileName.textContent = file.name;
          fileName.style.color = '';

          var reader = new FileReader();
          reader.onload = function (e) {
            var dataUrl = e.target.result;
            if (num === 1) faqPendingQr1 = dataUrl; else faqPendingQr2 = dataUrl;

            var clearId = 'adminClearFaq' + num;
            preview.innerHTML = '<img src="' + dataUrl + '" alt="预览"><button class="admin-btn admin-btn--danger admin-btn--small" id="' + clearId + '">清除</button>';
            bindFaqClearBtn(clearId, num);
          };
          reader.readAsDataURL(file);
        });
      }

      function bindFaqClearBtn(clearId, num) {
        var el = document.getElementById(clearId);
        if (!el) return;
        el.addEventListener('click', function () {
          if (num === 1) {
            document.getElementById('adminFaqQr1').value = '';
            document.getElementById('adminFaqPreview1').innerHTML = '';
            document.getElementById('adminFaqName1').textContent = '社群入群码';
            faqPendingQr1 = '';
          } else {
            document.getElementById('adminFaqQr2').value = '';
            document.getElementById('adminFaqPreview2').innerHTML = '';
            document.getElementById('adminFaqName2').textContent = '创始人微信';
            faqPendingQr2 = '';
          }
        });
      }

      bindFaqUpload('adminFaqQr1', 'adminFaqPreview1', 'adminFaqName1', 1);
      bindFaqUpload('adminFaqQr2', 'adminFaqPreview2', 'adminFaqName2', 2);

      document.getElementById('adminSaveFaq').addEventListener('click', function () {
        var label1 = document.getElementById('adminFaqLabel1').value.trim();
        var label2 = document.getElementById('adminFaqLabel2').value.trim();

        var data = {
          qr1: faqPendingQr1,
          qr2: faqPendingQr2,
          label1: label1 || '扫码进群',
          label2: label2 || '联系创始人'
        };
        try { localStorage.setItem(FAQ_KEY, JSON.stringify(data)); } catch (e) {}
        renderFaqQrCodes();
        alert('FAQ 二维码设置已保存');
      });

      // ========== Admin: 提交审核面板 ==========
      (function initAdminSubmissions() {
        var SUBMIT_KEY = 'tcai_submissions_v1';
        var listEl = document.getElementById('adminSubmissionsList');
        if (!listEl) return;

        function getSubmissions() {
          try { return JSON.parse(localStorage.getItem(SUBMIT_KEY)) || []; }
          catch(e) { return []; }
        }

        function saveSubmissions(list) {
          try { localStorage.setItem(SUBMIT_KEY, JSON.stringify(list)); } catch(e) {}
        }

        window.renderSubmissions = function () {
          var list = getSubmissions();
          var pending = list.filter(function (s) { return s.status === 'pending'; });
          if (pending.length === 0) {
            listEl.innerHTML = '<p style="color:var(--c-white-40);font-size:0.9rem;text-align:center;padding:24px;">暂无待审核的提交</p>';
            return;
          }
          listEl.innerHTML = pending.map(function (s) {
            return '<div class="admin-submission-item">' +
              '<div class="admin-submission__header">' +
                '<strong>' + escapeHtml(s.title) + '</strong>' +
                '<span style="color:var(--c-orange);font-size:0.8rem;font-weight:700;">待审核</span>' +
              '</div>' +
              '<div class="admin-submission__meta">' +
                '<span>提交人：' + escapeHtml(s.name) + '</span>' +
                '<span>联系方式：' + escapeHtml(s.contact) + '</span>' +
                '<span>' + new Date(s.createdAt).toLocaleDateString('zh-CN') + '</span>' +
              '</div>' +
              '<p class="admin-submission__desc">' + escapeHtml(s.desc) + '</p>' +
              '<div class="admin-submission__actions">' +
                '<button class="admin-btn admin-btn--primary admin-btn--small" data-approve="' + s.id + '">通过并转为项目</button>' +
                '<button class="admin-btn admin-btn--danger admin-btn--small" data-reject="' + s.id + '">拒绝</button>' +
              '</div>' +
            '</div>';
          }).join('');

          listEl.querySelectorAll('[data-approve]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-approve');
              var submissions = getSubmissions();
              var sub = null;
              for (var i = 0; i < submissions.length; i++) {
                if (submissions[i].id === id) {
                  submissions[i].status = 'approved';
                  sub = submissions[i];
                  break;
                }
              }
              saveSubmissions(submissions);
              if (sub) {
                var projects = (function () {
                  try { return JSON.parse(localStorage.getItem('tcai_projects_v1')) || []; }
                  catch(e) { return []; }
                })();
                projects.push({
                  id: 'p' + Date.now(),
                  name: sub.title,
                  desc: sub.desc,
                  link: '',
                  contact: sub.contact,
                  qrcode: '',
                  qrcode2: '',
                  status: '推广阶段',
                  statusClass: ''
                });
                try { localStorage.setItem('tcai_projects_v1', JSON.stringify(projects)); } catch(e) {}
                if (window.renderProjects) window.renderProjects();
                if (window.renderAdminList) window.renderAdminList();
              }
              window.renderSubmissions();
            });
          });

          listEl.querySelectorAll('[data-reject]').forEach(function (btn) {
            btn.addEventListener('click', function () {
              var id = this.getAttribute('data-reject');
              var submissions = getSubmissions();
              for (var i = 0; i < submissions.length; i++) {
                if (submissions[i].id === id) {
                  submissions[i].status = 'rejected';
                  break;
                }
              }
              saveSubmissions(submissions);
              window.renderSubmissions();
            });
          });
        };

        window.renderSubmissions();
      })();

      // ========== 编辑模式标题更新 ==========
      var origLoadProjectToForm = loadProjectToForm;
      loadProjectToForm = function (id) {
        origLoadProjectToForm(id);
        document.getElementById('projectFormTitle').textContent = '编辑项目';
      };
      var origClearEditMode = clearEditMode;
      clearEditMode = function () {
        origClearEditMode();
        document.getElementById('projectFormTitle').textContent = '添加新项目';
      };

    }

    renderProjects();

    // 同步后端数据(如果可用)
    (function syncFromBackend() {
      var API = 'http://localhost:3001';
      fetch(API + '/api/projects')
        .then(function (r) { return r.json(); })
        .then(function (list) {
          if (Array.isArray(list) && list.length) {
            saveProjects(list);
            renderProjects();
          }
        })
        .catch(function () {});
      fetch(API + '/api/faq-qr')
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (data && data.qr1) {
            try { localStorage.setItem('tcai_faq_qr_v1', JSON.stringify(data)); } catch (e) {}
            var container = document.getElementById('faqQrContainer');
            if (container) container.remove();
            renderFaqQrCodes();
          }
        })
        .catch(function () {});
    })();

    // ========== 项目筛选 ==========
    (function initProjectFilter() {
      var filterEl = document.getElementById('projectsFilter');
      if (!filterEl) return;
      filterEl.addEventListener('click', function (e) {
        var btn = e.target.closest('.projects-filter__btn');
        if (!btn) return;
        filterEl.querySelectorAll('.projects-filter__btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        renderProjects(btn.getAttribute('data-filter'));
      });
    })();

    // ========== FAQ 二维码渲染（放到 CTA 区域） ==========
    (function initFaqQr() {
      var FAQ_KEY = 'tcai_faq_qr_v1';

      window.renderFaqQrCodes = function () {
        var existing = document.getElementById('faqQrContainer');
        if (existing) existing.remove();

        try {
          var raw = localStorage.getItem(FAQ_KEY);
          if (!raw) return;
          var data = JSON.parse(raw);

          var hasQr1 = data.qr1 || '';
          var hasQr2 = data.qr2 || '';
          if (!hasQr1 && !hasQr2) return;

          var html = '<div class="faq-qr-container" id="faqQrContainer">';
          if (hasQr1) {
            html += '<div class="faq-qr-item">' +
              '<img loading="lazy" src="' + hasQr1 + '" alt="FAQ二维码1">' +
              '<span>' + escapeHtml(data.label1 || '扫码进群') + '</span>' +
            '</div>';
          }
          if (hasQr2) {
            html += '<div class="faq-qr-item">' +
              '<img loading="lazy" src="' + hasQr2 + '" alt="FAQ二维码2">' +
              '<span>' + escapeHtml(data.label2 || '联系创始人') + '</span>' +
            '</div>';
          }
          html += '</div>';

          var ctaArea = document.querySelector('.cta-qr-area');
          if (ctaArea) ctaArea.insertAdjacentHTML('beforeend', html);
        } catch (e) {}
      };

      renderFaqQrCodes();
    })();

    // ========== 用户提交项目表单 ==========
    (function initSubmitForm() {
      var SUBMIT_KEY = 'tcai_submissions_v1';
      var form = document.getElementById('submitForm');
      if (!form) return;

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
        var API = 'http://localhost:3001';
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

    // ===== 案例（Cases）加载 =====
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
            '<svg viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<span>' + escHtml(c.result || '') + '</span></div></div>';
        }).join('');
      };
      function escHtml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
      // Try API first
      fetch('/api/cases').then(function (r) { return r.json(); }).then(function (data) {
        if (Array.isArray(data) && data.length) { render(data); try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch(e){} return; }
        throw new Error('empty');
      }).catch(function () {
        var cached = []; try { var raw = localStorage.getItem(cacheKey); if (raw) cached = JSON.parse(raw); } catch(e) {}
        if (cached.length) render(cached);
      });
    })();

    createAdminUI();
  })();

})();
