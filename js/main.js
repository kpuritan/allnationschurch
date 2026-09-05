/**
 * 불로 열방교회 - 메인 인터랙션 스크립트
 */

document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header-main');
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const gnbMenu = document.querySelector('.gnb-menu');
  const gnbItems = document.querySelectorAll('.gnb-item');
  const navLinks = document.querySelectorAll('.gnb-link, .gnb-sublink, .btn-naver-gnb');

  // 스크롤 시 헤더 그림자 효과
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 모바일 메뉴 토글
  if (hamburgerBtn && gnbMenu) {
    hamburgerBtn.addEventListener('click', () => {
      gnbMenu.classList.toggle('open');
      const isOpen = gnbMenu.classList.contains('open');
      hamburgerBtn.setAttribute('aria-expanded', isOpen);
    });

    // 모바일 환경에서 드롭다운 토글
    gnbItems.forEach(item => {
      const link = item.querySelector('.gnb-link');
      if (link && window.innerWidth <= 768) {
        link.addEventListener('click', (e) => {
          const dropdown = item.querySelector('.gnb-dropdown');
          if (dropdown) {
            item.classList.toggle('active');
          }
        });
      }
    });

    // 링크 클릭 시 모바일 메뉴 닫기
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          gnbMenu.classList.remove('open');
        }
      });
    });
  }

  // 부드러운 스크롤 네비게이션
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
});
