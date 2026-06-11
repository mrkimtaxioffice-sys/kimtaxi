// script.js

document.addEventListener("DOMContentLoaded", () => {
  /* ================================
     1) Header / Footer 자동 삽입 + 메뉴 Active
  ================================ */
  fetch("header.html")
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("#header").innerHTML = html;

      // 현재 경로에 맞춰 메뉴 active 처리
      let path = window.location.pathname.split("/").pop();
      if (!path || path === "" || path === "/" || path.startsWith("?")) {
        path = "index.html";
      }
      path = path.split("?")[0];

      document.querySelectorAll(".nav-menu a").forEach((link) => {
        if (link.getAttribute("href") === path) {
          link.classList.add("active");
        }
      });

      // ====== 헤더 스크롤 축소 효과 ======
      const mainHeader = document.querySelector(".main-header");
      const mobileMenuEl = document.querySelector(".mobile-menu");
      if (mainHeader) {
        const onScroll = () => {
          if (window.scrollY > 40) {
            mainHeader.classList.add("scrolled");
            if (mobileMenuEl) mobileMenuEl.style.top = "64px";
          } else {
            mainHeader.classList.remove("scrolled");
            if (mobileMenuEl) mobileMenuEl.style.top = "80px";
          }
        };
        onScroll();
        window.addEventListener("scroll", onScroll);
      }

      // ====== 모바일 햄버거 메뉴 토글 ======
      const hamburger = document.querySelector(".hamburger");
      const mobileMenu = document.querySelector(".mobile-menu");

      if (hamburger && mobileMenu) {
        hamburger.addEventListener("click", () => {
          const isOpen = mobileMenu.classList.toggle("show");
          hamburger.classList.toggle("active");
          hamburger.setAttribute("aria-label", isOpen ? "메뉴 닫기" : "메뉴 열기");
          hamburger.setAttribute("aria-expanded", isOpen);
        });

        // 키보드(Enter/Space)로도 메뉴 열기
        hamburger.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            hamburger.click();
          }
        });

        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            mobileMenu.classList.remove("show");
            hamburger.classList.remove("active");
            hamburger.setAttribute("aria-label", "메뉴 열기");
            hamburger.setAttribute("aria-expanded", "false");
          });
        });
      }
    });

  fetch("footer.html")
    .then((res) => res.text())
    .then((html) => {
      document.querySelector("#footer").innerHTML = html;
    });

  /* ================================
     2) 상담하기 버튼 스크롤 이동 (홈 / CTA 공통)
  ================================ */
  const consultButtons = document.querySelectorAll(".btn.consult");
  const consultSection = document.getElementById("consult");

  if (consultSection && consultButtons.length > 0) {
    consultButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        if (btn.tagName.toLowerCase() === "a") {
          e.preventDefault();
        }
        consultSection.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  /* ================================
     3) 실시간 상담 내역 (부드러운 무한 스크롤 + 카드형)
  ================================ */
  const list = document.getElementById("fakeList");
  if (list) {
    function formatKRDate(offsetDays = 0) {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${m}월 ${day}일`;
    }

    const fakeConsults = [
      { offset: 0, label: "최**님",        status: "상담중" },
      { offset: 0, label: "그랜저 차량",   status: "상담중" },
      { offset: 0, label: "K5 차량",       status: "상담완료" },
      { offset: 0, label: "박**님",        status: "상담중" },
      { offset: 1, label: "김**님",        status: "상담완료" },
      { offset: 1, label: "소나타 차량",   status: "상담중" },
      { offset: 1, label: "오**님",        status: "상담중" },
      { offset: 2, label: "스타렉스 차량", status: "상담완료" },
      { offset: 2, label: "이**님",        status: "상담중" },
      { offset: 3, label: "아반떼 차량",   status: "상담중" },
    ];

    list.innerHTML = "";
    fakeConsults.forEach((item) => {
      const li = document.createElement("li");
      const dateStr = formatKRDate(item.offset);
      const done = item.status === "상담완료";

      li.classList.add("consult-item");
      li.innerHTML = `
        <div class="consult-left">
          <span class="consult-date">${dateStr}</span>
          <span class="consult-name">${item.label}</span>
        </div>
        <span class="consult-status ${done ? "done" : "ing"}">
          ${item.status}
        </span>
      `;
      list.appendChild(li);
    });

    list.innerHTML = list.innerHTML + list.innerHTML;
  }

  /* ================================
     4) 등장 애니메이션
  ================================ */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    },
    { threshold: 0.08 }
  );

  document
    .querySelectorAll(".fade-up, .about-left, .about-right, .vision-card, .service-card")
    .forEach((el) => observer.observe(el));

  /* ================================
     5) FAQ 아코디언 (faq.html 및 기타 페이지 공통)
        index.html은 자체 인라인 스크립트로 처리하므로
        index.html에서는 이 로직이 중복 실행되지 않도록
        .faq-question에 data-bound 플래그로 중복 바인딩 방지
  ================================ */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    if (btn.dataset.bound) return; // 이미 바인딩된 버튼은 건너뜀
    btn.dataset.bound = "1";
    btn.setAttribute("type", "button");

    btn.addEventListener("click", () => {
      const currentItem = btn.parentElement;
      const currentAnswer = currentItem.querySelector(".faq-answer");
      const isActive = currentItem.classList.contains("active");

      // 열린 항목 모두 닫기
      document.querySelectorAll(".faq-item.active").forEach((item) => {
        item.classList.remove("active");
        const ans = item.querySelector(".faq-answer");
        if (ans) ans.style.maxHeight = "0";
      });

      // 클릭한 항목이 닫혀 있었으면 열기
      // requestAnimationFrame: 닫기 처리 후 DOM이 안정된 시점에
      // scrollHeight를 읽어 정확한 높이 계산
      if (!isActive) {
        currentItem.classList.add("active");
        if (currentAnswer) {
          requestAnimationFrame(() => {
            currentAnswer.style.maxHeight = currentAnswer.scrollHeight + "px";
          });
        }
      }
    });
  });
});
