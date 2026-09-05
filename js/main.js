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

  // 비디오 강해 시리즈 카테고리 필터링
  const videoFilterBtns = document.querySelectorAll('.v-tab-btn');
  const videoCards = document.querySelectorAll('.video-card');

  videoFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      videoFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filterValue = btn.getAttribute('data-vfilter');

      videoCards.forEach(card => {
        const cardCat = card.getAttribute('data-vcat');
        if (filterValue === 'all' || cardCat === filterValue) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });
});

/**
 * 천로역정 1~52강 전편 통합 뷰어 모달
 */
let pilgrimLecturesData = null;

async function openPilgrimModal() {
  const existing = document.getElementById('pilgrim-modal');
  if (existing) existing.remove();

  // 데이터 로드
  if (!pilgrimLecturesData) {
    try {
      const res = await fetch('data/pilgrim_progress.json?v=' + Date.now());
      if (res.ok) {
        pilgrimLecturesData = await res.json();
      }
    } catch (e) {
      console.error('천로역정 데이터 로드 실패', e);
    }
  }

  const lectures = pilgrimLecturesData || [];

  const modal = document.createElement('div');
  modal.id = 'pilgrim-modal';
  modal.className = 'pilgrim-modal-backdrop';

  modal.innerHTML = `
    <div class="pilgrim-modal-container">
      <button type="button" class="pilgrim-modal-close" onclick="closePilgrimModal()">✕</button>
      
      <div class="pilgrim-modal-header">
        <div class="pilgrim-header-thumb">
          <img src="images/pilgrims_progress.jpg" alt="천로역정 강해 1-52강">
        </div>
        <div class="pilgrim-header-info">
          <span class="pilgrim-header-badge">존 번연의 순례자의 길</span>
          <h2 class="pilgrim-header-title">천로역정 완주 강해 (1강 ~ 52강 전편)</h2>
          <p class="pilgrim-header-desc">
            박훈 담임목사님의 천로역정 1부 전편 완주 설교 목록입니다.<br>
            <strong>1~40강</strong>(금요기도회 강해)과 <strong>41~52강</strong>(불로열방교회 유튜브 재생목록)이 통합되어 순서대로 시청하실 수 있습니다.
          </p>
        </div>
      </div>

      <!-- 모달 내 탭 & 검색 -->
      <div class="pilgrim-controls">
        <div class="pilgrim-tabs">
          <button class="p-tab-btn active" data-ptab="all">전체보기 (52강)</button>
          <button class="p-tab-btn" data-ptab="part1">1부 (1~40강)</button>
          <button class="p-tab-btn" data-ptab="part2">2부 (41~52강)</button>
        </div>
        <div class="pilgrim-search-box">
          <input type="text" id="pilgrim-search-input" placeholder="강의 제목 또는 본문 검색 (예: 십자가, 41강, 마태복음)..." />
        </div>
      </div>

      <!-- 강의 리스트 그리드 -->
      <div class="pilgrim-lecture-list" id="pilgrim-lecture-list">
        <!-- 동적 렌더링 -->
      </div>

      <div class="pilgrim-modal-footer">
        <span>© 불로 열방교회 말씀 아카이브</span>
        <a href="https://www.youtube.com/watch?v=k4TW9EVfywA&list=PLSaHerzUahU_GSoYHiCp_X246jruIfXKC" target="_blank" rel="noopener noreferrer" class="btn-yt-direct">
          ▶ 유튜브 41-52강 재생목록 바로가기
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closePilgrimModal();
    }
  });

  // 렌더링 함수 실행
  renderPilgrimList('all', '');

  // 탭 클릭 이벤트
  modal.querySelectorAll('.p-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.p-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tab = btn.getAttribute('data-ptab');
      const searchVal = document.getElementById('pilgrim-search-input').value.trim();
      renderPilgrimList(tab, searchVal);
    });
  });

  // 검색 입력 이벤트
  const searchInput = document.getElementById('pilgrim-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const activeTab = modal.querySelector('.p-tab-btn.active').getAttribute('data-ptab');
      renderPilgrimList(activeTab, e.target.value.trim());
    });
  }
}

function renderPilgrimList(tab, query) {
  const container = document.getElementById('pilgrim-lecture-list');
  if (!container || !pilgrimLecturesData) return;

  let filtered = pilgrimLecturesData;

  if (tab === 'part1') {
    filtered = filtered.filter(item => item.ep <= 40);
  } else if (tab === 'part2') {
    filtered = filtered.filter(item => item.ep >= 41);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(item => 
      item.title.toLowerCase().includes(q) ||
      item.passage.toLowerCase().includes(q) ||
      (item.ep + '강').includes(q) ||
      item.ep.toString() === q
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem; color:#888; grid-column: 1 / -1;">
        검색 결과에 해당하는 강의가 없습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div class="pilgrim-item-card ${item.ep >= 41 ? 'part2-card' : ''}">
      <div class="p-item-left">
        <span class="p-ep-badge">${item.ep}강</span>
        <div class="p-info">
          <h4 class="p-title">${item.title}</h4>
          <div class="p-meta">
            <span class="p-passage">📖 ${item.passage}</span>
            <span class="p-source">${item.source}</span>
          </div>
        </div>
      </div>
      <a href="${item.url}" target="_blank" rel="noopener noreferrer" class="p-watch-btn">
        <span>시청하기</span> ▶
      </a>
    </div>
  `).join('');
}

function closePilgrimModal() {
  const modal = document.getElementById('pilgrim-modal');
  if (modal) modal.remove();
  document.body.style.overflow = '';
}

