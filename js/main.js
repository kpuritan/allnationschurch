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

  // 비디오 강해 시리즈 카테고리 필터링 (기존 지원)
  const videoFilterBtns = document.querySelectorAll('.v-tab-btn');
  if (videoFilterBtns.length > 0) {
    videoFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        videoFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // 말씀 강해 아카이브 시스템 초기화
  initArchiveSystem();
});

/**
 * ==========================================================
 * 말씀 강해 2단 폴더 아카이브 시스템 (Image 2 레이아웃 & 동작)
 * ==========================================================
 */
const ARCHIVE_FOLDERS = [
  { key: 'ot', title: '구약성경 권별 개관설교', count: '39편', icon: '📜', bgClass: 'bg-ot' },
  { key: 'john', title: '요한복음 강해', count: '40강', icon: '📖', bgClass: 'bg-nt', thumb: 'images/john_gospel.jpg' },
  { key: 'romans', title: '로마서 강해 (1-11장)', count: '31강', icon: '📖', bgClass: 'bg-nt' },
  { key: 'dort', title: '도르트 신조', count: '19편', icon: '🏛️', bgClass: 'bg-doctrine' },
  { key: 'dort_review', title: '다시보는 도르트 신조', count: '12편', icon: '💡', bgClass: 'bg-doctrine' },
  { key: 'pilgrim', title: '천로역정 완주 강해', count: '52강', icon: '🌄', bgClass: 'bg-special', thumb: 'images/pilgrims_progress.jpg' },
  { key: 'commandments', title: '십계명 강해', count: '10편', icon: '⚖️', bgClass: 'bg-doctrine' },
  { key: 'exodus', title: '출애굽기 강해', count: '22편', icon: '🌊', bgClass: 'bg-ot' },
  { key: 'genesis_classic', title: '창세기 강해 (13편)', count: '13편', icon: '🌱', bgClass: 'bg-ot' },
  { key: 'genesis', title: '창세기 설교 (15편)', count: '15편', icon: '🌱', bgClass: 'bg-ot' },
  { key: 'luke', title: '누가복음 강해', count: '30편', icon: '📖', bgClass: 'bg-nt' },
  { key: 'hebrews', title: '히브리서 강해', count: '15편', icon: '✝️', bgClass: 'bg-nt' },
  { key: 'acts', title: '사도행전 강해', count: '15편', icon: '🔥', bgClass: 'bg-nt' }
];

let currentFolderKey = 'ot';
let archiveDataCache = null;
let pilgrimDataCache = null;

async function initArchiveSystem() {
  const folderListEl = document.getElementById('archive-folder-list');
  if (!folderListEl) return;

  // 1. 좌측 폴더 목록 렌더링
  folderListEl.innerHTML = ARCHIVE_FOLDERS.map(f => `
    <li class="archive-folder-item ${f.key === currentFolderKey ? 'active' : ''}" data-fkey="${f.key}" onclick="selectArchiveFolder('${f.key}')">
      <div class="folder-name-wrap">
        <span class="folder-icon">📁</span>
        <span>${f.title}</span>
      </div>
      <span class="folder-count-badge">${f.count}</span>
    </li>
  `).join('');

  // 2. 데이터 미리 로드
  await loadArchiveData();

  // 3. 기본 선택 폴더 렌더링
  renderArchiveFolderContent(currentFolderKey, '');

  // 4. 검색창 이벤트
  const searchInput = document.getElementById('archive-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderArchiveFolderContent(currentFolderKey, e.target.value.trim());
    });
  }
}

async function loadArchiveData() {
  if (!archiveDataCache) {
    try {
      const res = await fetch('data/sermons_archive.json?v=' + Date.now());
      if (res.ok) archiveDataCache = await res.json();
    } catch (e) {
      console.error('sermons_archive load error', e);
    }
  }
  if (!pilgrimDataCache) {
    try {
      const res = await fetch('data/pilgrim_progress.json?v=' + Date.now());
      if (res.ok) pilgrimDataCache = await res.json();
    } catch (e) {
      console.error('pilgrim_progress load error', e);
    }
  }
}

async function selectArchiveFolder(folderKey) {
  currentFolderKey = folderKey;
  
  // 사이드바 active 업데이트
  document.querySelectorAll('.archive-folder-item').forEach(el => {
    if (el.getAttribute('data-fkey') === folderKey) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  const searchInput = document.getElementById('archive-search-input');
  if (searchInput) searchInput.value = '';

  await loadArchiveData();
  renderArchiveFolderContent(folderKey, '');
}

function renderArchiveFolderContent(folderKey, query) {
  const titleEl = document.getElementById('archive-current-title');
  const countEl = document.getElementById('archive-item-count');
  const gridEl = document.getElementById('archive-video-grid');
  if (!gridEl) return;

  const folderMeta = ARCHIVE_FOLDERS.find(f => f.key === folderKey) || ARCHIVE_FOLDERS[0];

  let episodes = [];
  let seriesTitle = folderMeta.title;

  if (folderKey === 'pilgrim') {
    episodes = (pilgrimDataCache || []).map(p => ({
      ep: p.ep,
      title: `${p.ep}강 - ${p.title}`,
      passage: p.passage,
      url: p.url,
      search: `불로열방교회 천로역정 ${p.ep}강 ${p.title}`
    }));
  } else if (archiveDataCache && archiveDataCache[folderKey]) {
    const s = archiveDataCache[folderKey];
    episodes = s.episodes || [];
    seriesTitle = s.title;
  }

  // 검색어 필터링
  if (query) {
    const q = query.toLowerCase();
    episodes = episodes.filter(ep => 
      ep.title.toLowerCase().includes(q) ||
      (ep.passage && ep.passage.toLowerCase().includes(q)) ||
      (ep.ep + '강').includes(q) ||
      (ep.ep + '편').includes(q) ||
      ep.ep.toString() === q
    );
  }

  if (titleEl) titleEl.textContent = `${folderMeta.title} 자료 목록`;
  if (countEl) countEl.textContent = `총 ${episodes.length}개 자료 전부 (1/1페이지)`;

  if (episodes.length === 0) {
    gridEl.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
        <p style="font-size: 1.1rem; font-weight: 600;">검색 결과에 해당하는 강의가 없습니다.</p>
        <p style="font-size: 0.88rem; margin-top: 6px;">다른 검색어를 입력하시거나 좌측 폴더를 선택해 주세요.</p>
      </div>
    `;
    return;
  }

  // 카드 그리드 렌더링 (Image 2 스타일)
  gridEl.innerHTML = episodes.map(item => {
    let thumbHtml = '';
    if (folderMeta.thumb) {
      thumbHtml = `<img src="${folderMeta.thumb}" alt="${item.title}" class="card-thumb-img">`;
    } else {
      thumbHtml = `
        <div class="card-thumb-placeholder ${folderMeta.bgClass}">
          <span class="thumb-topic-tag">${folderMeta.title}</span>
          <span class="thumb-korean-tag">${item.ep}강 / ${item.passage || ''}</span>
        </div>
      `;
    }

    return `
      <div class="video-thumb-card" onclick="playArchiveLecture('${folderKey}', ${item.ep})">
        <div class="card-thumb-wrap">
          ${thumbHtml}
          <div class="play-btn-circle">▶</div>
        </div>
        <div class="card-body">
          <h4 class="card-title">${item.title}</h4>
          <div class="card-meta-row">
            <span class="card-author">👤 박훈 담임목사</span>
            <span class="card-passage">📖 ${item.passage || (item.ep + '강')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function playArchiveLecture(folderKey, epNumber) {
  let item = null;
  let seriesTitle = '';

  if (folderKey === 'pilgrim') {
    const list = pilgrimDataCache || [];
    const p = list.find(x => x.ep === epNumber);
    if (p) {
      item = {
        ep: p.ep,
        title: `${p.ep}강 - ${p.title}`,
        passage: p.passage,
        url: p.url,
        search: `불로열방교회 천로역정 ${p.ep}강 ${p.title}`
      };
      seriesTitle = '천로역정 완주 강해';
    }
  } else if (archiveDataCache && archiveDataCache[folderKey]) {
    const s = archiveDataCache[folderKey];
    seriesTitle = s.title;
    item = (s.episodes || []).find(x => x.ep === epNumber);
  }

  if (!item) return;

  const playerArea = document.getElementById('archive-top-player');
  const iframe = document.getElementById('archive-player-iframe');
  const titleSpan = document.getElementById('archive-player-title');
  const extLink = document.getElementById('archive-player-yt-link');

  if (!playerArea || !iframe) return;

  // 비디오 ID 추출
  let videoId = '';
  if (item.url) {
    if (item.url.includes('v=')) {
      const m = item.url.match(/v=([a-zA-Z0-9_-]+)/);
      if (m) videoId = m[1];
    } else if (item.url.includes('youtu.be/')) {
      const m = item.url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (m) videoId = m[1];
    }
  }

  const queryTerm = item.search || ('불로열방교회 ' + item.title);
  const extUrl = item.url || `https://www.youtube.com/results?search_query=${encodeURIComponent(queryTerm)}`;

  if (extLink) extLink.href = extUrl;
  if (titleSpan) titleSpan.textContent = `▶ 방영 중: ${item.title}`;

  if (videoId) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  } else {
    // 검색 임베드 또는 폴백 플레이어
    iframe.src = `https://www.youtube.com/embed?listType=search&list=${encodeURIComponent(queryTerm)}&autoplay=1`;
  }

  playerArea.style.display = 'block';
  playerArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeArchivePlayer() {
  const playerArea = document.getElementById('archive-top-player');
  const iframe = document.getElementById('archive-player-iframe');
  if (playerArea && iframe) {
    iframe.src = '';
    playerArea.style.display = 'none';
  }
}

/**
 * 하위 호환 모달 뷰어 (GNB 드롭다운 등에서 호출 시 바로 해당 폴더로 이동 & 스크롤)
 */
async function openSermonSeriesModal(seriesKey) {
  await selectArchiveFolder(seriesKey);
  const section = document.getElementById('sermon-videos');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}

async function openPilgrimModal() {
  await selectArchiveFolder('pilgrim');
  const section = document.getElementById('sermon-videos');
  if (section) {
    section.scrollIntoView({ behavior: 'smooth' });
  }
}



