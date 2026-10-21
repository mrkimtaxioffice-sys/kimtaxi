// script.js — 김군 개인택시 상담소 공통 스크립트
// 2026.10 업그레이드: 마이크로 인터랙션 레이어 추가 (아래 ✦ 표시 구역)
//
// 동작 확인: 반드시 웹서버(호스팅 또는 VS Code Live Server 등)로 열어야 합니다.
//            파일을 더블클릭(file://)으로 열면 header/footer를 불러오지 못합니다.

/* ─── 설정 ─── */
// PC(마우스 사용 기기)에서 전화번호를 누르면 전화 대신 '번호 복사 + 안내'를 띄웁니다.
// PC에도 전화 앱 연결을 원하시면 false 로 바꾸세요.
const TEL_COPY_ON_DESKTOP = true;

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const root = document.documentElement;
  root.classList.add("mi-js");
  if (!reduceMotion) root.classList.add("mi-motion");

  /* ================================
     공통 도우미
  ================================ */
  // 마우스 이동처럼 자주 생기는 이벤트를 화면 그리기 주기(1/60초)에 한 번만 처리
  const rafThrottle = (fn) => {
    let id = 0, lastArgs;
    return (...args) => {
      lastArgs = args;
      if (id) return;
      id = requestAnimationFrame(() => { id = 0; fn(...lastArgs); });
    };
  };
  // 안드로이드 폰에서 버튼을 누를 때 아주 짧은 진동 (아이폰은 무시됨)
  const vibrate = (pattern = 8) => {
    try { if (navigator.vibrate) navigator.vibrate(pattern); } catch (_) { /* 미지원 기기 */ }
  };
  // 애니메이션 다시 시작 (같은 클래스를 다시 붙여도 재생되도록)
  const replay = (el, cls) => {
    el.classList.remove(cls);
    void el.offsetWidth; // 강제 리플로우
    el.classList.add(cls);
  };

  /* ================================
     1) Header / Footer 삽입
  ================================ */
  function loadPartial(url, targetSelector) {
    const target = document.querySelector(targetSelector);
    if (!target) return Promise.resolve(null);
    return fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`${url} 불러오기 실패 (${res.status})`);
        return res.text();
      })
      .then((html) => {
        target.innerHTML = html;
        return target;
      })
      .catch((err) => {
        console.error(err);
        // 최소한의 대체 링크 — 헤더가 안 떠도 연락은 가능하도록
        target.innerHTML =
          '<p style="padding:12px 20px;text-align:center;font-size:14px;">' +
          '<a href="index.html">김군 개인택시 상담소</a> · ' +
          '<a href="tel:01055559156">010-5555-9156</a></p>';
        return null;
      });
  }

  loadPartial("header.html", "#header").then((ok) => {
    if (!ok) return;
    initHeader();
    safe(initHeaderMicro);
  });

  loadPartial("footer.html", "#footer").then((ok) => {
    if (!ok) return;
    const yearEl = document.getElementById("copyYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    safe(initFooterMicro);
  });

  function initHeader() {
    // 현재 페이지 메뉴 active
    let path = window.location.pathname.split("/").pop().split("?")[0];
    if (!path) path = "index.html";
    document.querySelectorAll(".nav-menu a, .mobile-menu > a").forEach((link) => {
      if (link.getAttribute("href") === path) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });

    // 스크롤 시 헤더 그림자
    const mainHeader = document.querySelector(".main-header");
    if (mainHeader) {
      const onScroll = () => mainHeader.classList.toggle("scrolled", window.scrollY > 40);
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });
    }

    // 모바일 햄버거 메뉴
    const hamburger = document.querySelector(".hamburger");
    const mobileMenu = document.querySelector(".mobile-menu");
    if (!hamburger || !mobileMenu) return;

    const setMenu = (open) => {
      mobileMenu.classList.toggle("show", open);
      hamburger.classList.toggle("active", open);
      hamburger.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
      hamburger.setAttribute("aria-expanded", String(open));
    };

    hamburger.addEventListener("click", () => {
      setMenu(!mobileMenu.classList.contains("show"));
      vibrate(6);
    });
    mobileMenu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ================================
     2) 상담 신청 버튼 → 폼으로 부드럽게 이동 (index.html 안에서만)
  ================================ */
  const consultSection = document.getElementById("consult");
  if (consultSection) {
    document.querySelectorAll('.btn.consult[href="#consult"]').forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        consultSection.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      });
    });
  }

  /* ================================
     3) 자주 받는 상담 (주제 목록)
        ※ 기존 '실시간 접수' 목록은 실제 접수 데이터가 아닌
          고정 데이터에 오늘 날짜를 붙여 보여주던 방식이라
          기만적 광고 소지가 있어 '상담 주제 안내'로 바꿨습니다.
  ================================ */
  const list = document.getElementById("topicList");
  if (list) {
    const topics = [
      { tag: "sell", label: "양도", text: "지금 번호판 시세가 얼마인가요?" },
      { tag: "buy",  label: "양수", text: "법인택시 경력 없어도 양수 가능한가요?" },
      { tag: "buy",  label: "양수", text: "양수교육은 언제 받는 게 좋을까요?" },
      { tag: "sell", label: "양도", text: "차량까지 같이 넘기면 얼마나 받나요?" },
      { tag: "etc",  label: "서류", text: "양도·양수 때 어떤 서류가 필요한가요?" },
      { tag: "buy",  label: "양수", text: "계약금·잔금 일정은 어떻게 잡나요?" },
      { tag: "sell", label: "양도", text: "급하게 정리해야 하는데 얼마나 걸리나요?" },
      { tag: "etc",  label: "기타", text: "미터기·카드단말기 업체 소개 가능한가요?" },
      { tag: "buy",  label: "양수", text: "조합 가입은 어떻게 진행되나요?" },
      { tag: "etc",  label: "기타", text: "상담만 받아도 비용이 드나요?" },
    ];

    const frag = document.createDocumentFragment();
    topics.forEach((t) => {
      const li = document.createElement("li");
      li.className = "consult-item";
      li.innerHTML = `
        <div class="consult-left">
          <span class="consult-name"></span>
        </div>
        <span class="consult-tag ${t.tag}"></span>`;
      li.querySelector(".consult-name").textContent = t.text;
      li.querySelector(".consult-tag").textContent = t.label;
      frag.appendChild(li);
    });
    list.innerHTML = "";
    list.appendChild(frag);
  }

  /* ================================
     5) 등장 애니메이션 (.fade-up 클래스를 직접 붙인 요소용 — 기존 호환)
  ================================ */
  const fadeEls = document.querySelectorAll(".fade-up");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    fadeEls.forEach((el) => observer.observe(el));
  } else {
    fadeEls.forEach((el) => el.classList.add("visible"));
  }

  /* ================================
     6) FAQ 아코디언 (index.html / faq.html 공통)
  ================================ */
  document.querySelectorAll(".faq-question").forEach((btn, idx) => {
    if (btn.dataset.bound) return;
    btn.dataset.bound = "1";
    btn.setAttribute("type", "button");
    btn.setAttribute("aria-expanded", "false");

    const item = btn.parentElement;
    const answer = item.querySelector(".faq-answer");
    if (answer) {
      answer.id = answer.id || `faq-answer-${idx}`;
      btn.setAttribute("aria-controls", answer.id);
    }

    btn.addEventListener("click", () => {
      const isActive = item.classList.contains("active");

      document.querySelectorAll(".faq-item.active").forEach((openItem) => {
        openItem.classList.remove("active");
        const a = openItem.querySelector(".faq-answer");
        const q = openItem.querySelector(".faq-question");
        if (a) a.style.maxHeight = "0";
        if (q) q.setAttribute("aria-expanded", "false");
      });

      if (!isActive) {
        item.classList.add("active");
        btn.setAttribute("aria-expanded", "true");
        if (answer) {
          requestAnimationFrame(() => {
            answer.style.maxHeight = answer.scrollHeight + "px";
          });
        }
      }
    });
  });

  /* =====================================================================
     ✦ 마이크로 인터랙션 레이어
     - 각 기능은 safe()로 감싸 하나가 실패해도 나머지·기존 기능은 그대로 동작
  ===================================================================== */
  function safe(fn) {
    try { fn(); } catch (err) { console.warn("[마이크로 인터랙션]", fn.name, err); }
  }

  /* ✦ 안내 토스트 */
  let toastEl = null, toastTimer = 0;
  function toast(html, ms = 2800) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "mi-toast";
      toastEl.setAttribute("role", "status");
      toastEl.setAttribute("aria-live", "polite");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = html; // 내부 고정 문구만 넣습니다 (사용자 입력 X)
    requestAnimationFrame(() => toastEl.classList.add("show"));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), ms);
  }

  /* ✦ 버튼 물결(ripple) + 터치 진동 — 헤더·푸터 포함 전체에 위임 방식으로 적용 */
  function initRipple() {
    const SEL = ".btn-ink, .btn-line, .btn-yellow, .btn-line-light, .btn-kakao, .btn-map, .mobile-btn, " +
                ".toggle-btn, .ch-cta, .fc-row a, .faq-jump a, .hero-channels a, .float-btn, .mbar a, .fs-btn";
    document.addEventListener("pointerdown", (e) => {
      const el = e.target.closest(SEL);
      if (!el) return;
      if (e.pointerType === "touch") vibrate(8);
      if (reduceMotion || el.classList.contains("float-btn")) return;
      const r = el.getBoundingClientRect();
      const size = Math.max(r.width, r.height) * 2.2;
      const dot = document.createElement("span");
      dot.className = "mi-ripple";
      dot.setAttribute("aria-hidden", "true");
      dot.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`;
      el.appendChild(dot);
      dot.addEventListener("animationend", () => dot.remove());
    }, { passive: true });
  }

  /* ✦ 자석 버튼: 마우스가 가까이 오면 버튼이 살짝 따라옴 (PC 전용) */
  function magnet(el, strength = 0.22) {
    if (!finePointer || reduceMotion || el.dataset.miMagnet) return;
    el.dataset.miMagnet = "1";
    let inside = false;
    const move = rafThrottle((e) => {
      if (!inside) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty("--tx", ((e.clientX - (r.left + r.width / 2)) * strength).toFixed(1) + "px");
      el.style.setProperty("--ty", ((e.clientY - (r.top + r.height / 2)) * strength).toFixed(1) + "px");
    });
    el.addEventListener("pointerenter", () => { inside = true; });
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", () => {
      inside = false;
      el.style.setProperty("--tx", "0px");
      el.style.setProperty("--ty", "0px");
    });
  }

  /* ✦ 스포트라이트: 카드 위 마우스 위치에 은은한 조명 (PC 전용) */
  function spotlight(el, addClass = true) {
    if (!finePointer || reduceMotion) return;
    if (addClass) el.classList.add("mi-spot");
    el.addEventListener("pointermove", rafThrottle((e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));
  }

  /* ✦ 3D 기울기: 카드가 마우스 방향으로 살짝 기울어짐 (PC 전용) */
  function tilt(el, max = 6, target = el) {
    if (!finePointer || reduceMotion) return;
    let inside = false;
    el.addEventListener("pointerenter", () => { inside = true; });
    el.addEventListener("pointermove", rafThrottle((e) => {
      if (!inside) return;
      const r = target.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      target.style.setProperty("--ry", (px * max * 2).toFixed(2) + "deg");
      target.style.setProperty("--rx", (-py * max * 1.4).toFixed(2) + "deg");
    }));
    el.addEventListener("pointerleave", () => {
      inside = false;
      target.style.setProperty("--rx", "0deg");
      target.style.setProperty("--ry", "0deg");
    });
  }

  /* ✦ 헤더: 스크롤 진행 막대 + 미끄러지는 메뉴 표시줄 + 모바일 메뉴 순차 등장 */
  function initHeaderMicro() {
    const header = document.querySelector(".main-header");
    if (!header) return;

    // 스크롤 진행 막대
    const bar = document.createElement("span");
    bar.className = "mi-progress";
    bar.setAttribute("aria-hidden", "true");
    header.appendChild(bar);
    const updateBar = rafThrottle(() => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.setProperty("--p", max > 0 ? Math.min(1, window.scrollY / max).toFixed(4) : "0");
    });
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();

    // 메뉴 표시줄
    const nav = header.querySelector(".nav-menu");
    if (nav) {
      const ind = document.createElement("span");
      ind.className = "nav-indicator";
      ind.setAttribute("aria-hidden", "true");
      nav.appendChild(ind);
      nav.classList.add("has-indicator");
      const active = nav.querySelector("a.active");
      const moveTo = (a) => {
        if (!a) { ind.style.setProperty("--o", "0"); return; }
        ind.style.setProperty("--x", a.offsetLeft + "px");
        ind.style.setProperty("--w", a.offsetWidth + "px");
        ind.style.setProperty("--o", "1");
      };
      ind.style.transition = "none";
      moveTo(active);
      void ind.offsetWidth;
      ind.style.transition = "";
      nav.querySelectorAll("a").forEach((a) => {
        a.addEventListener("mouseenter", () => moveTo(a));
        a.addEventListener("focus", () => moveTo(a));
      });
      nav.addEventListener("mouseleave", () => moveTo(active));
      nav.addEventListener("focusout", (e) => { if (!nav.contains(e.relatedTarget)) moveTo(active); });
      window.addEventListener("resize", rafThrottle(() => moveTo(active)));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => moveTo(active));
    }

    // 모바일 메뉴 항목 순서 번호 (CSS가 차례로 등장시킴)
    header.querySelectorAll(".mobile-menu > a, .mobile-actions > a").forEach((a, i) => a.style.setProperty("--i", i));

    // 헤더 상담 버튼 자석 효과
    header.querySelectorAll(".nav-actions .btn-ink").forEach((b) => magnet(b, 0.18));

    initFontSize(header.querySelector(".fs-btn"));
  }

  /* ✦ 글자 크기 버튼: 보통 → 크게 → 아주 크게 → 보통 (이 기기에 저장) */
  function initFontSize(btn) {
    if (!btn) return;
    const LEVELS = [
      { fs: "1", name: "보통" },
      { fs: "1.12", name: "크게" },
      { fs: "1.25", name: "아주 크게" },
    ];
    let level = 0;
    try {
      const saved = localStorage.getItem("kg_fs");
      const i = LEVELS.findIndex((l) => l.fs === saved);
      if (i > 0) level = i;
    } catch (_) { /* 저장 불가 환경 */ }

    const apply = (announce) => {
      const l = LEVELS[level];
      root.style.setProperty("--fs", l.fs);
      btn.dataset.level = String(level);
      const next = LEVELS[(level + 1) % LEVELS.length].name;
      btn.setAttribute("aria-label", `글자 크기 바꾸기 (현재: ${l.name}, 누르면 ${next})`);
      btn.title = `글자 크기: ${l.name}`;
      try { localStorage.setItem("kg_fs", l.fs); } catch (_) { /* 무시 */ }
      if (announce) {
        replay(btn, "bump");
        toast(`<i class="fa-solid fa-text-height" aria-hidden="true"></i> 글자 크기: ${l.name}`, 1800);
        // 글자 크기가 바뀌면 메뉴 표시줄·FAQ 열린 높이 다시 계산
        window.dispatchEvent(new Event("resize"));
        document.querySelectorAll(".faq-item.active .faq-answer").forEach((a) => { a.style.maxHeight = a.scrollHeight + "px"; });
      }
    };
    apply(false);
    btn.addEventListener("click", () => {
      level = (level + 1) % LEVELS.length;
      apply(true);
    });
  }

  /* ✦ 푸터: 떠 있는 버튼 말풍선·자석·등장 */
  function initFooterMicro() {
    document.querySelectorAll(".float-btn").forEach((b, i) => {
      b.dataset.tip = b.classList.contains("kakao") ? "카카오톡 상담" : "전화 상담";
      b.style.setProperty("--i", i);
      magnet(b, 0.3);
    });

    // 모바일 하단 바: 입력 중(키보드가 올라올 때)에는 잠시 숨김
    const mbar = document.querySelector(".mbar");
    if (mbar) {
      const isField = (el) => el && el.matches && el.matches("input:not([type=radio]):not([type=checkbox]), select, textarea");
      document.addEventListener("focusin", (e) => { if (isField(e.target)) mbar.classList.add("hide"); });
      document.addEventListener("focusout", (e) => {
        if (isField(e.target)) setTimeout(() => { if (!isField(document.activeElement)) mbar.classList.remove("hide"); }, 150);
      });
    }
  }

  /* ✦ '상담 예약' 링크: 같은 페이지에 예약 폼이 있으면 새로고침 없이 부드럽게 이동 + 폼 반짝 */
  function initConsultLinks() {
    const consult = document.getElementById("consult");
    if (!consult) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href="#consult"], a[href="index.html#consult"]');
      if (!a) return;
      e.preventDefault();
      consult.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
      history.replaceState(null, "", "#consult");
      const card = consult.querySelector(".form-card");
      if (card && !reduceMotion) setTimeout(() => replay(card, "mi-ping"), 650);
    });
  }

  /* ✦ PC에서 전화번호 클릭 → 번호 복사 + 안내 */
  function initTelCopy() {
    if (!TEL_COPY_ON_DESKTOP || !finePointer || !navigator.clipboard) return;
    document.addEventListener("click", (e) => {
      const a = e.target.closest('a[href^="tel:"]');
      if (!a) return;
      const d = a.getAttribute("href").replace(/\D/g, "");
      const num = d.length === 11 ? `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}` : d;
      e.preventDefault();
      navigator.clipboard.writeText(num)
        .then(() => toast(`<i class="fa-solid fa-copy" aria-hidden="true"></i> ${num} 복사됨 · 휴대폰으로 걸어주세요`))
        .catch(() => { window.location.href = a.href; }); // 복사 실패 시 원래대로 전화 연결
    });
  }

  /* ✦ 스크롤하면 요소가 차례로 떠오름 */
  function initReveal() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    const SEL = [
      ".section .title", ".section .lead", ".feature-list li", ".quick-item", ".channel", ".review",
      ".service-block", ".box", ".aside-block", ".form-card", ".stat-row > div", ".faq-item", ".faq-cat h2",
      ".cta-band", ".ceo-note > *", ".intro-photo", ".loc-list > div", ".info-table", ".autumn-band",
      ".bento-card", ".channel-card",
    ].join(",");
    const els = [...document.querySelectorAll(SEL)].filter((el) => !el.closest(".home-hero, .page-hero, .road-steps") && !el.parentElement.closest(".mi-reveal"));
    const count = new Map();
    els.forEach((el) => {
      const n = count.get(el.parentElement) || 0;
      count.set(el.parentElement, n + 1);
      el.style.setProperty("--d", `${Math.min(n, 6) * 0.08}s`);
      el.classList.add("mi-reveal");
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        io.unobserve(el);
        el.classList.add("in");
        const delay = parseFloat(el.style.getPropertyValue("--d")) || 0;
        // 등장이 끝나면 클래스를 지워, 원래의 호버 효과가 지연 없이 동작하도록
        setTimeout(() => {
          el.classList.remove("mi-reveal", "in");
          el.style.removeProperty("--d");
        }, 900 + delay * 1000);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    els.forEach((el) => io.observe(el));
  }

  /* ✦ 진행 단계: 택시가 도로를 달리며 단계가 하나씩 켜짐 */
  function initRoad() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    document.querySelectorAll(".road-steps").forEach((ol) => {
      const steps = ol.querySelectorAll("li");
      ol.classList.add("mi-road");
      steps.forEach((li, i) => li.style.setProperty("--i", i));
      const taxi = document.createElement("span");
      taxi.className = "mi-taxi";
      taxi.setAttribute("aria-hidden", "true");
      taxi.innerHTML = '<img src="img/taxi-3d.webp" alt="" width="50" height="34">';
      ol.appendChild(taxi);
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        ol.classList.add("go");
        setTimeout(() => ol.classList.add("done"), 600 + steps.length * 400 + 700);
      }, { threshold: 0.35 });
      io.observe(ol);
    });
  }

  /* ✦ 숫자 카운트업 (소개 페이지 5년+ / 1,200+) */
  function initCountUp() {
    if (reduceMotion || !("IntersectionObserver" in window)) return;
    document.querySelectorAll(".stat-row strong").forEach((el) => {
      const raw = el.textContent.trim();
      const m = raw.match(/^([^\d]*)([\d,]+)(.*)$/);
      if (!m) return;
      const target = parseInt(m[2].replace(/,/g, ""), 10);
      if (!target) return;
      const fmt = (n) => m[1] + n.toLocaleString("ko-KR") + m[3];
      el.textContent = fmt(0);
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        const start = performance.now(), dur = 1400;
        const tick = (now) => {
          const t = Math.min(1, (now - start) / dur);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = t < 1 ? fmt(Math.round(target * eased)) : raw;
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }, { threshold: 0.5 });
      io.observe(el);
    });
  }

  /* ✦ 카드·버튼에 스포트라이트·기울기·자석·화살표 연결 */
  function initPointerFx() {
    document.querySelectorAll(".quick-item, .aside-block, .service-block, .box, .cta-band, .review, .feature-list li, .form-card, .bento-road, .bento-mini")
      .forEach((el) => spotlight(el));
    document.querySelectorAll(".channel").forEach((el) => { spotlight(el, false); tilt(el, 5); });
    document.querySelectorAll(".hero-actions a, .cta-actions a, .band-copy .btn-yellow, .season-copy .btn-yellow, .loc-actions a, .box.tip .btn-ink")
      .forEach((el) => magnet(el));

    // 번호판: 마우스 방향으로 기울어짐
    const hv = document.querySelector(".hero-visual");
    const stage = hv && hv.querySelector(".hero-stage");
    if (stage) {
      tilt(hv, 7, stage);
      // 택시는 반대 방향으로 조금 더 움직여 입체감(깊이) 연출
      if (finePointer && !reduceMotion) {
        hv.addEventListener("pointermove", rafThrottle((e) => {
          const r = stage.getBoundingClientRect();
          stage.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
          stage.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
        }));
        hv.addEventListener("pointerleave", () => { stage.style.setProperty("--px", "0"); stage.style.setProperty("--py", "0"); });
      }
    }
    // 택시를 누르면 '폴짝'
    const heroTaxi = document.querySelector(".hero-taxi");
    if (heroTaxi) heroTaxi.addEventListener("click", () => { if (!reduceMotion) replay(heroTaxi, "hop"); vibrate(10); });

    // 글자만 있는 버튼에 화살표 / 히어로 대표 버튼 은은한 반짝임
    document.querySelectorAll("a.btn-ink, a.btn-yellow").forEach((a) => {
      if (!a.querySelector("i") && !a.classList.contains("btn-sm")) a.classList.add("mi-arrow");
    });
    const heroCta = document.querySelector(".hero-actions .btn-ink");
    if (heroCta && !reduceMotion) heroCta.classList.add("mi-attn");
  }

  /* ✦ FAQ: 분류 버튼을 누르면 해당 제목이 반짝 */
  function initFaqJump() {
    document.querySelectorAll('.faq-jump a[href^="#"]').forEach((a) => {
      a.addEventListener("click", () => {
        const t = document.querySelector(a.getAttribute("href"));
        if (t) setTimeout(() => replay(t, "mi-flash"), reduceMotion ? 0 : 380);
      });
    });
  }

  /* ✦ 상담 예약 폼 (index.html) — 기존 폼 코드는 그대로 두고 반응만 덧입힘 */
  function initFormMicro() {
    const form = document.getElementById("consultForm");
    if (!form) return;
    const formContent = document.getElementById("formContent");
    const toggleBox = document.querySelector(".toggle-container");
    const btnBuy = document.getElementById("btnBuy");
    const PHONE_RE = /^01[016789]-?\d{3,4}-?\d{4}$/;

    // 입력 확인 (이름 2글자 이상, 연락처 형식) → 초록 체크
    const check = (input) => {
      const g = input.closest(".input-group");
      if (!g) return;
      const v = input.value.trim();
      const ok = input.id === "phone" ? PHONE_RE.test(v) : v.length >= 2;
      g.classList.toggle("is-valid", ok);
    };
    const checkAll = () => form.querySelectorAll("#name, #phone").forEach(check);
    form.addEventListener("input", (e) => { if (e.target.matches("#name, #phone")) check(e.target); });

    // 양도/양수 전환: 미끄러지는 알약 + 입력칸 다시 등장
    if (toggleBox && btnBuy) {
      toggleBox.classList.add("mi-slider");
      const sync = () => toggleBox.classList.toggle("is-buy", btnBuy.classList.contains("active"));
      sync();
      toggleBox.querySelectorAll(".toggle-btn").forEach((b) => b.addEventListener("click", () => {
        sync();
        if (formContent && !reduceMotion) replay(formContent, "mi-swap");
        checkAll();
      }));
    }

    // 보안코드: 눌러서 새 코드 / 대문자 자동 변환 / 맞으면 초록
    const cap = document.getElementById("captchaText");
    const capInput = document.getElementById("captchaInput");
    if (cap && capInput && typeof window.generateCaptcha === "function") {
      cap.setAttribute("role", "button");
      cap.tabIndex = 0;
      cap.title = "누르면 새 코드로 바뀝니다";
      const regen = () => {
        replay(cap, "spin");
        setTimeout(() => {
          window.generateCaptcha();
          capInput.closest(".captcha-box")?.classList.remove("is-valid");
        }, reduceMotion ? 0 : 200);
        capInput.focus();
      };
      cap.addEventListener("click", regen);
      cap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); regen(); }
      });
    }
    if (cap && capInput) {
      capInput.addEventListener("input", () => {
        const pos = capInput.selectionStart;
        capInput.value = capInput.value.toUpperCase();
        try { capInput.setSelectionRange(pos, pos); } catch (_) { /* 일부 브라우저 */ }
        capInput.closest(".captcha-box")?.classList.toggle("is-valid", capInput.value.trim() === cap.innerText);
      });
    }

    // 제출 버튼 상태: 전송 중 → 스피너, 성공 → 초록 + 단풍, 실패 → 흔들림
    const btn = document.getElementById("submitBtn");
    const msg = document.getElementById("submitMsg");
    if (btn) {
      new MutationObserver(() => btn.classList.toggle("is-loading", btn.disabled))
        .observe(btn, { attributes: true, attributeFilter: ["disabled"] });
    }
    if (btn && msg) {
      new MutationObserver(() => {
        const t = msg.textContent.trim();
        if (!t) return;
        if (!reduceMotion) replay(msg, "mi-msg");
        if (t.startsWith("✅")) {
          btn.classList.add("is-success");
          leafBurst(btn);
          vibrate([12, 60, 12]);
          setTimeout(() => btn.classList.remove("is-success"), 2600);
          form.querySelectorAll(".is-valid").forEach((g) => g.classList.remove("is-valid"));
        } else if (t !== "전송 중...") {
          if (!reduceMotion) replay(btn, "mi-shake");
          vibrate([10, 40, 10]);
        }
      }).observe(msg, { childList: true, characterData: true, subtree: true });
    }
  }

  /* ✦ 예약 성공 시 단풍잎이 톡 터져 떨어짐 */
  function leafBurst(origin) {
    if (reduceMotion) return;
    const r = origin.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const colors = ["#b8452b", "#d9a400", "#f6c21c", "#c96a2c", "#8a3a1e"];
    for (let i = 0; i < 18; i++) {
      const leaf = document.createElement("i");
      leaf.className = "fa-solid fa-leaf mi-leaf";
      leaf.setAttribute("aria-hidden", "true");
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
      const dist = 80 + Math.random() * 120;
      const xm = cx + Math.cos(ang) * dist, ym = cy + Math.sin(ang) * dist;
      leaf.style.cssText = [
        `--x0:${cx}px`, `--y0:${cy}px`, `--xm:${xm}px`, `--ym:${ym}px`,
        `--x1:${xm + (Math.random() - 0.5) * 120}px`, `--y1:${ym + 180 + Math.random() * 160}px`,
        `--r:${(Math.random() - 0.5) * 720}deg`, `--s:${14 + Math.random() * 12}px`,
        `--c:${colors[i % colors.length]}`, `--t:${1.4 + Math.random() * 0.8}s`,
      ].join(";");
      document.body.appendChild(leaf);
      leaf.addEventListener("animationend", () => leaf.remove());
    }
  }

  /* ✦ 양수교육 체크리스트: 눌러서 체크, 이 기기에 저장 */
  function initTodo() {
    const todo = document.querySelector(".todo-list");
    if (!todo) return;
    const KEY = "kimgun_edu_checklist_v1";
    let saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (_) { saved = []; }
    const items = [...todo.querySelectorAll("li")];

    const prog = document.createElement("div");
    prog.className = "mi-todo-progress";
    prog.innerHTML = '<span class="mi-todo-bar"><span></span></span><span class="mi-todo-count" aria-live="polite"></span>';
    todo.before(prog);
    const fill = prog.querySelector(".mi-todo-bar > span");
    const countEl = prog.querySelector(".mi-todo-count");

    const update = (byUser) => {
      const n = items.filter((li) => li.classList.contains("done")).length;
      fill.style.setProperty("--pct", (n / items.length).toFixed(3));
      countEl.textContent = n === 0 ? "눌러서 체크해 보세요" : `${n} / ${items.length} 준비 완료`;
      if (byUser && n === items.length) {
        toast('<i class="fa-solid fa-leaf" aria-hidden="true"></i> 준비 끝! 이제 교육 회차를 잡아볼까요?');
      }
    };

    items.forEach((li, i) => {
      const icon = li.querySelector("i");
      li.classList.add("mi-check");
      li.setAttribute("role", "checkbox");
      li.tabIndex = 0;
      const set = (on) => {
        li.classList.toggle("done", on);
        li.setAttribute("aria-checked", String(on));
        if (icon) icon.className = on ? "fa-solid fa-square-check" : "fa-regular fa-square";
      };
      set(saved.includes(i));
      const flip = () => {
        set(!li.classList.contains("done"));
        vibrate(8);
        try {
          localStorage.setItem(KEY, JSON.stringify(items.map((x, j) => (x.classList.contains("done") ? j : -1)).filter((j) => j >= 0)));
        } catch (_) { /* 저장 불가(사생활 보호 모드 등) — 화면 체크는 그대로 동작 */ }
        update(true);
      };
      li.addEventListener("click", flip);
      li.addEventListener("keydown", (e) => {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
      });
    });
    update(false);
  }

  // 실행
  safe(initRipple);
  safe(initConsultLinks);
  safe(initTelCopy);
  safe(initReveal);
  safe(initRoad);
  safe(initCountUp);
  safe(initPointerFx);
  safe(initFaqJump);
  safe(initFormMicro);
  safe(initTodo);
});
