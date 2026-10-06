// script.js — 김군 개인택시 상담소 공통 스크립트
//
// 동작 확인: 반드시 웹서버(호스팅 또는 VS Code Live Server 등)로 열어야 합니다.
//            파일을 더블클릭(file://)으로 열면 header/footer를 불러오지 못합니다.

document.addEventListener("DOMContentLoaded", () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
  });

  loadPartial("footer.html", "#footer").then((ok) => {
    if (!ok) return;
    const yearEl = document.getElementById("copyYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();
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

    // 스크롤 시 헤더 축소
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

    hamburger.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("show")));
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
     3) 자주 받는 상담 (자동 스크롤 리스트)
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
     5) 등장 애니메이션
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
});
