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
      if (mainHeader) {
        const onScroll = () => {
          if (window.scrollY > 40) {
            mainHeader.classList.add("scrolled");
          } else {
            mainHeader.classList.remove("scrolled");
          }
        };
        onScroll(); // 초기 상태 한 번 체크
        window.addEventListener("scroll", onScroll);
      }

      // ====== 모바일 햄버거 메뉴 토글 ======
      const hamburger = document.querySelector(".hamburger");
      const mobileMenu = document.querySelector(".mobile-menu");

      if (hamburger && mobileMenu) {
        hamburger.addEventListener("click", () => {
          mobileMenu.classList.toggle("show");
          hamburger.classList.toggle("active");
        });

        // 모바일 메뉴에서 항목 클릭 시 메뉴 닫기
        mobileMenu.querySelectorAll("a").forEach((link) => {
          link.addEventListener("click", () => {
            mobileMenu.classList.remove("show");
            hamburger.classList.remove("active");
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
        // a 태그면 기본 앵커 이동 막기
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
    // 한국식 날짜 포맷: MM월 DD일
    function formatKRDate(offsetDays = 0) {
      const d = new Date();
      d.setDate(d.getDate() - offsetDays);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${m}월 ${day}일`;
    }

    // 실시간 상담 느낌을 위한 더미 데이터 (이름 + 차량 혼합)
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

    // 리스트 초기화 후 카드형 구조로 생성
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

    // 자연스러운 무한 스크롤을 위해 한 번 더 복제
    list.innerHTML = list.innerHTML + list.innerHTML;
    // 실제 애니메이션은 CSS의 @keyframes scrollList에서 처리
  }

  /* ================================
     4) 등장 애니메이션 (about / service / notice / location)
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
});

/* ================================
   5) FAQ 아코디언 기능
================================ */
document.addEventListener("click", (e) => {
  const questionBtn = e.target.closest(".faq-question");
  if (!questionBtn) return;

  const currentItem = questionBtn.parentElement;
  const currentAnswer = currentItem.querySelector(".faq-answer");

  // 이미 열려 있으면 닫기
  if (currentItem.classList.contains("active")) {
    currentItem.classList.remove("active");
    if (currentAnswer) currentAnswer.style.maxHeight = "0";
    return;
  }

  // 다른 항목들 닫기 (아코디언)
  document.querySelectorAll(".faq-item.active").forEach((item) => {
    item.classList.remove("active");
    const answer = item.querySelector(".faq-answer");
    if (answer) answer.style.maxHeight = "0";
  });

  // 현재 항목 열기
  currentItem.classList.add("active");
  if (currentAnswer) {
    currentAnswer.style.maxHeight = currentAnswer.scrollHeight + "px";
  }
});
