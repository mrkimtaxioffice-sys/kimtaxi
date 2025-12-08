document.addEventListener("DOMContentLoaded", () => {
/* ================================
   Header / Footer 자동 삽입 + Active Highlight
================================ */
fetch("header.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("#header").innerHTML = html;

    // 정확한 path 파싱
    let path = window.location.pathname.split("/").pop();

    if (!path || path === "" || path === "/" || path.startsWith("?")) {
      path = "index.html";
    }
    path = path.split("?")[0];

    document.querySelectorAll(".nav-menu a").forEach(link => {
      if (link.getAttribute("href") === path) {
        link.classList.add("active");
      }
    });
  });

fetch("footer.html")
  .then(res => res.text())
  .then(html => {
    document.querySelector("#footer").innerHTML = html;
  });

  /* ================================
      2) 상담하기 버튼 스크롤 이동
         (홈 / 오시는 길 CTA 공통)
  ================================ */
  const consultBtn = document.querySelector(".btn.consult");
  const consultSection = document.getElementById("consult");

  if (consultBtn && consultSection) {
    consultBtn.addEventListener("click", () => {
      consultSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  /* ================================
      3) 자동 스크롤 상담 내역 (홈 전용)
  ================================ */
  const list = document.getElementById("fakeList");
  if (list) {
    setInterval(() => {
      list.appendChild(list.firstElementChild);
    }, 2500);
  }

  /* ================================
      4) 등장 애니메이션
         (about / service / notice / location)
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
    .querySelectorAll(
      ".fade-up, .about-left, .about-right, .vision-card, .service-card"
    )
    .forEach((el) => observer.observe(el));

  /* ================================
      5) 공지사항 없음 표시
  ================================ */
  const noticeItems = document.querySelectorAll(".notice-card");
  const noNoticeBox = document.getElementById("noNoticeBox");

  if (noNoticeBox && noticeItems.length === 0) {
    noNoticeBox.style.display = "block";
    setTimeout(() => noNoticeBox.classList.add("visible"), 100);
  }
});

/* ================================
      FAQ 아코디언 기능
================================ */
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("faq-question")) {
    const item = e.target.parentElement;
    item.classList.toggle("active");

    const answer = item.querySelector(".faq-answer");
    if (item.classList.contains("active")) {
      answer.style.maxHeight = answer.scrollHeight + "px";
    } else {
      answer.style.maxHeight = "0";
    }
  }
});


