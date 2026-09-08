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

    // 링크 클릭 시 모바일 메뉴 닫기
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          gnbMenu.classList.remove('open');
        }
      });
    });
  }

  // 비디오 강해 시리즈 카테고리 필터링
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

  // 관리자 인증 상태 반영 및 UI 업데이트
  updateSiteAdminUI();
  
  // BGM 최초 클릭 자동재생 리스너 (브라우저 오디오 정책)
  document.addEventListener('click', initBgmOnFirstInteraction, { once: true });
});

/**
 * ==========================================================
 * 📑 탭/페이지 전환형 네비게이션 시스템 (SPA Navigation)
 * ==========================================================
 */
function navigateToPage(pageId, subFolderKey, isFromHistory = false) {
  // 1. 모든 페이지 뷰 숨기기
  const pages = document.querySelectorAll('.page-view');
  pages.forEach(p => {
    p.classList.remove('active');
  });

  // 2. 대상 페이지 활성화
  const targetPage = document.getElementById('page-' + pageId);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // 3. GNB 활성 메뉴 표시
  document.querySelectorAll('.gnb-link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === '#' + pageId || (pageId === 'home' && href === '#home')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // 4. 모바일 메뉴 닫기
  const gnbMenu = document.querySelector('.gnb-menu');
  if (gnbMenu && gnbMenu.classList.contains('open')) {
    gnbMenu.classList.remove('open');
  }

  // 5. 브라우저 히스토리 상태 push (뒤로가기/앞으로가기 지원)
  if (!isFromHistory) {
    const newHash = '#' + pageId + (subFolderKey ? '/' + subFolderKey : '');
    if (window.location.hash !== newHash) {
      history.pushState({ pageId, subFolderKey }, '', newHash);
    }
  }

  // 6. 만약 특정 말씀 강해 폴더가 지정된 경우 폴더 선택
  if (pageId === 'sermons') {
    if (subFolderKey) {
      if (subFolderKey === 'news') {
        const newsSection = document.getElementById('sermons-news');
        if (newsSection) newsSection.scrollIntoView({ behavior: 'smooth' });
      } else {
        selectArchiveFolder(subFolderKey, isFromHistory);
      }
    }
  } else {
    // 말씀 강해 외의 탭으로 이동 시 상단 플레이어 정리
    closeArchivePlayer(true);
  }

  // 7. 상단으로 부드럽게 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * ==========================================================
 * 말씀 강해 2단 폴더 아카이브 시스템 (Image 2 레이아웃 & 동작)
 * ==========================================================
 */
const UNIFIED_FOLDER_SVG = `
  <svg class="folder-svg-icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-1.5V6.75A2.25 2.25 0 0 0 15.75 4.5H8.25A2.25 2.25 0 0 0 6 6.75V10.5H4.5a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM4.5 12h15a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18v-4.5A1.5 1.5 0 0 1 4.5 12Z"/>
  </svg>
`;

const ARCHIVE_FOLDERS = [
  { key: 'ot', title: '구약성경 권별 개관설교', count: '39편', icon: '📁', bgClass: 'bg-ot' },
  { key: 'john', title: '요한복음 강해', count: '20강', icon: '📁', bgClass: 'bg-nt', thumb: 'images/john_gospel.jpg' },
  { key: 'romans', title: '로마서 강해 (1-11장)', count: '31강', icon: '📁', bgClass: 'bg-nt' },
  { key: 'dort', title: '도르트 신조', count: '19편', icon: '📁', bgClass: 'bg-doctrine' },
  { key: 'dort_review', title: '다시보는 도르트 신조', count: '20편', icon: '📁', bgClass: 'bg-doctrine' },
  { key: 'pilgrim', title: '천로역정 완주 강해', count: '52강', icon: '📁', bgClass: 'bg-special', thumb: 'images/pilgrims_progress.jpg' },
  { key: 'commandments', title: '십계명 강해', count: '10편', icon: '📁', bgClass: 'bg-doctrine' },
  { key: 'exodus', title: '출애굽기 강해', count: '22편', icon: '📁', bgClass: 'bg-ot' },
  { key: 'genesis_classic', title: '창세기 강해 (13편)', count: '13편', icon: '📁', bgClass: 'bg-ot' },
  { key: 'genesis', title: '창세기 설교 (15편)', count: '15편', icon: '📁', bgClass: 'bg-ot' },
  { key: 'luke', title: '누가복음 강해', count: '67강', icon: '📁', bgClass: 'bg-nt' },
  { key: 'mark', title: '마가복음 강해', count: '44강', icon: '📁', bgClass: 'bg-nt' },
  { key: 'hebrews', title: '히브리서 강해', count: '15편', icon: '📁', bgClass: 'bg-nt' },
  { key: 'acts', title: '사도행전 강해', count: '15편', icon: '📁', bgClass: 'bg-nt' }
];

let currentFolderKey = 'ot';
let archiveDataCache = null;
let pilgrimDataCache = null;
let activeFoldersList = ARCHIVE_FOLDERS;

function getEffectiveFolders() {
  const saved = localStorage.getItem('ALLNATIONS_ADMIN_DATA_V1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.folders && parsed.folders.length > 0) {
        return parsed.folders;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return ARCHIVE_FOLDERS;
}

function isSiteAdminLoggedIn() {
  return localStorage.getItem('allnations_admin_auth') === 'true';
}

function updateSiteAdminUI() {
  const isAdmin = isSiteAdminLoggedIn();
  const topBar = document.getElementById('admin-top-bar');
  const loginBtn = document.getElementById('btn-open-admin-login');

  if (isAdmin) {
    document.body.classList.add('admin-logged-in');
    if (topBar) topBar.style.display = 'flex';
    if (loginBtn) {
      loginBtn.innerHTML = '<span>👑</span> 관리자 ON';
      loginBtn.style.background = 'rgba(34, 197, 94, 0.25)';
      loginBtn.style.borderColor = '#22c55e';
    }
  } else {
    document.body.classList.remove('admin-logged-in');
    if (topBar) topBar.style.display = 'none';
    if (loginBtn) {
      loginBtn.innerHTML = '<span>🔐</span> 관리자 로그인';
      loginBtn.style.background = 'rgba(255, 255, 255, 0.15)';
      loginBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
    }
  }

  // 폴더 & 설교 리스트 UI 다시 그리기 (수정/삭제 버튼 반영)
  renderArchiveFolderSidebar();
  renderArchiveFolderContent(currentFolderKey, '');
}

async function initArchiveSystem() {
  closeArchivePlayer(true);
  await loadArchiveData();
  activeFoldersList = getEffectiveFolders();
  renderArchiveFolderSidebar();
  
  // URL 해시 기반 라우팅 (새로고침 또는 북마크/뒤로가기 초기 복원)
  handleInitialRoute();

  const searchInput = document.getElementById('archive-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderArchiveFolderContent(currentFolderKey, e.target.value.trim());
    });
  }
}

function renderArchiveFolderSidebar() {
  const folderListEl = document.getElementById('archive-folder-list');
  if (!folderListEl) return;

  activeFoldersList = getEffectiveFolders();
  const isAdmin = isSiteAdminLoggedIn();

  // 폴더 리스트 상단 관리자용 [➕ 새 폴더] 버튼
  const addFolderBtnHtml = isAdmin ? `
    <li class="sermon-tab-admin-add">
      <button type="button" onclick="openFolderCreateModal()" class="admin-bar-btn" style="background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 30px; font-weight: 700; font-size: 0.88rem; cursor: pointer;">
        ➕ 새 폴더 추가
      </button>
    </li>
  ` : '';

  folderListEl.innerHTML = addFolderBtnHtml + activeFoldersList.map(f => {
    let epCount = f.count || '0편';
    if (archiveDataCache && archiveDataCache[f.key] && archiveDataCache[f.key].episodes) {
      const count = archiveDataCache[f.key].episodes.length;
      if (f.key === 'mark' || f.key === 'pilgrim' || f.key === 'luke' || f.key === 'john' || f.key === 'romans') {
        epCount = `${count}강`;
      } else {
        epCount = `${count}편`;
      }
    } else if (f.key === 'pilgrim' && pilgrimDataCache) {
      epCount = `${pilgrimDataCache.length}강`;
    }

    const delBtnHtml = (isAdmin && !ARCHIVE_FOLDERS.some(orig => orig.key === f.key)) ? `
      <button onclick="handleDeleteSiteFolder(event, '${f.key}')" title="폴더 삭제" style="background: none; border: none; color: #ef4444; font-size: 0.8rem; cursor: pointer; padding: 2px 4px; margin-left: 4px;">🗑️</button>
    ` : '';

    return `
      <li class="sermon-tab-item archive-folder-item ${f.key === currentFolderKey ? 'active' : ''}" data-fkey="${f.key}" onclick="selectArchiveFolder('${f.key}')">
        <span class="tab-folder-icon">📁</span>
        <span class="tab-folder-title">${f.title}</span>
        <span class="tab-count-badge folder-count-badge">${epCount}</span>
        ${delBtnHtml}
      </li>
    `;
  }).join('');
}

async function loadArchiveData() {
  if (window.INITIAL_SERMONS_ARCHIVE) {
    archiveDataCache = JSON.parse(JSON.stringify(window.INITIAL_SERMONS_ARCHIVE));
  }
  if (window.INITIAL_PILGRIM_DATA) {
    pilgrimDataCache = JSON.parse(JSON.stringify(window.INITIAL_PILGRIM_DATA));
  }

  try {
    const res = await fetch('data/sermons_archive.json?v=' + Date.now());
    if (res.ok) {
      const fetchedArchive = await res.json();
      archiveDataCache = { ...(archiveDataCache || {}), ...fetchedArchive };
    }
  } catch (e) {
    console.warn('sermons_archive fetch skipped/fallback to bundle', e);
  }

  const saved = localStorage.getItem('ALLNATIONS_ADMIN_DATA_V1');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed.archive) {
        archiveDataCache = archiveDataCache || {};
        for (const k of Object.keys(parsed.archive)) {
          archiveDataCache[k] = parsed.archive[k];
        }
      }
    } catch (e) {
      console.error(e);
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

function saveEffectiveData() {
  const payload = {
    folders: activeFoldersList,
    archive: archiveDataCache,
    updatedAt: new Date().toISOString()
  };
  localStorage.setItem('ALLNATIONS_ADMIN_DATA_V1', JSON.stringify(payload));
}

async function selectArchiveFolder(folderKey, isFromHistory = false) {
  currentFolderKey = folderKey;
  
  // 브라우저 히스토리 상태 push
  if (!isFromHistory) {
    const targetHash = `#sermons/${folderKey}`;
    if (window.location.hash !== targetHash) {
      history.pushState({ pageId: 'sermons', subFolderKey: folderKey }, '', targetHash);
    }
  }

  // 강해 카테고리 탭 전환 시 상단 TV 플레이어를 닫고 깨끗한 목록 상태로 초기화
  closeArchivePlayer(true);

  document.querySelectorAll('.archive-folder-item, .sermon-tab-item').forEach(el => {
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

  const folders = getEffectiveFolders();
  const folderMeta = folders.find(f => f.key === folderKey) || folders[0] || ARCHIVE_FOLDERS[0];
  const isAdmin = isSiteAdminLoggedIn();

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

  if (titleEl) titleEl.textContent = folderMeta.title;
  if (countEl) countEl.textContent = `총 ${episodes.length}개 말씀 영상`;

  // 관리자 모드 시 [➕ 현재 폴더에 설교 등록] 버튼 바 생성
  let adminAddBarHtml = '';
  if (isAdmin) {
    adminAddBarHtml = `
      <div class="admin-quick-add-bar" style="grid-column: 1 / -1; background: #e0f2fe; border: 1px dashed #0284c7; padding: 0.9rem 1.4rem; border-radius: 12px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
        <span style="font-weight: 700; color: #0369a1; font-size: 0.92rem;">
          ⚙️ '${folderMeta.title}' 시리즈에 새 설교를 등록하거나 아래 카드에서 즉시 수정/삭제할 수 있습니다.
        </span>
        <button type="button" onclick="openLectureAddModal('${folderKey}')" class="admin-bar-btn" style="background: #0284c7; color: #fff; border: none; padding: 7px 16px; border-radius: 6px; font-weight: 700; cursor: pointer;">
          ➕ 새 설교 영상 등록
        </button>
      </div>
    `;
  }

  if (episodes.length === 0) {
    gridEl.innerHTML = adminAddBarHtml + `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; color: var(--text-muted);">
        <p style="font-size: 1.15rem; font-weight: 700; color: var(--text-dark);">등록된 설교 영상이 없습니다.</p>
        <p style="font-size: 0.9rem; margin-top: 6px;">검색어를 확인하시거나 다른 강해 카테고리를 선택해 보세요.</p>
      </div>
    `;
    return;
  }

  // 카드 그리드 렌더링
  gridEl.innerHTML = adminAddBarHtml + episodes.map((item, idx) => {
    let videoId = extractYouTubeId(item.url);
    if (!videoId && folderMeta.playlistUrl) {
      videoId = extractYouTubeId(folderMeta.playlistUrl);
    }

    let thumbHtml = '';
    if (item.thumb) {
      thumbHtml = `<img src="${item.thumb}" alt="${item.title}" class="sermon-card-thumb-img card-thumb-img" loading="lazy">`;
    } else if (videoId) {
      // 실제 유튜브 고화질 썸네일 자동 연동
      thumbHtml = `<img src="https://i.ytimg.com/vi/${videoId}/hqdefault.jpg" alt="${item.title}" class="sermon-card-thumb-img card-thumb-img" loading="lazy" onerror="this.onerror=null; this.src='https://img.youtube.com/vi/${videoId}/mqdefault.jpg'">`;
    } else if (folderMeta.thumb) {
      thumbHtml = `<img src="${folderMeta.thumb}" alt="${item.title}" class="sermon-card-thumb-img card-thumb-img" loading="lazy">`;
    } else {
      thumbHtml = `
        <div class="sermon-card-placeholder card-thumb-placeholder ${folderMeta.bgClass || 'bg-ot'}">
          <span class="sermon-card-series-tag thumb-topic-tag">${folderMeta.title}</span>
          <span class="sermon-card-ep-tag thumb-korean-tag">${item.ep}강 ${item.passage ? '· ' + item.passage : ''}</span>
        </div>
      `;
    }

    const pdfBadge = item.pdfUrl ? `<span style="background:#10b981; color:#fff; font-size:0.75rem; padding:3px 8px; border-radius:4px; font-weight:700; white-space:nowrap;">📄 교재</span>` : '';

    // 관리자 수정/삭제 버튼
    const epSafeParam = encodeURIComponent(String(item.ep));
    const adminActionsHtml = isAdmin ? `
      <div class="card-admin-actions" onclick="event.stopPropagation()">
        <button type="button" class="btn-card-edit" onclick="openLectureEditModal('${folderKey}', decodeURIComponent('${epSafeParam}'))">✏️ 수정</button>
        <button type="button" class="btn-card-del" onclick="handleDeleteSiteLecture('${folderKey}', decodeURIComponent('${epSafeParam}'))">🗑️ 삭제</button>
      </div>
    ` : '';

    return `
      <div class="sermon-card-item video-thumb-card" onclick="playArchiveLecture('${folderKey}', decodeURIComponent('${epSafeParam}'))">
        ${adminActionsHtml}
        <div class="sermon-card-thumb-wrap card-thumb-wrap">
          ${thumbHtml}
          <div class="sermon-play-badge play-btn-circle">▶</div>
          <span class="sermon-thumb-ep-badge">${item.ep}강</span>
        </div>
        <div class="sermon-card-body card-body">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 0.8rem;">
            <h4 class="sermon-card-title card-title" title="${item.title}">${item.title}</h4>
            ${pdfBadge}
          </div>
          <div class="sermon-card-meta card-meta-row">
            <span class="sermon-card-speaker card-author">👤 박훈 담임목사</span>
            <span class="sermon-card-passage card-passage">📖 ${item.passage || (item.ep + '강')}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function extractYouTubeId(url) {
  if (!url) return '';
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : '';
}

function playArchiveLecture(folderKey, epNumber, isFromHistory = false) {
  let item = null;
  let seriesTitle = '';

  if (folderKey === 'pilgrim') {
    const list = pilgrimDataCache || [];
    const p = list.find(x => x.ep === epNumber || String(x.ep) === String(epNumber) || x.ep == epNumber);
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
    const num = parseInt(epNumber);
    item = (s.episodes || []).find(x => 
      x.ep === epNumber || 
      x.ep === num || 
      String(x.ep) === String(epNumber) || 
      (x.ep + '강') === String(epNumber) ||
      (typeof x.ep === 'string' && x.ep.replace(/[^0-9]/g, '') === String(epNumber).replace(/[^0-9]/g, ''))
    );
  }

  if (!item) {
    console.warn('Lecture not found:', folderKey, epNumber);
    return;
  }

  // 브라우저 히스토리 상태 push
  if (!isFromHistory) {
    const targetHash = `#sermons/${folderKey}/${encodeURIComponent(epNumber)}`;
    if (window.location.hash !== targetHash) {
      history.pushState({ pageId: 'sermons', subFolderKey: folderKey, ep: epNumber }, '', targetHash);
    }
  }

  const playerArea = document.getElementById('archive-top-player');
  const playerWrapper = document.getElementById('archive-player-wrapper') || document.querySelector('#archive-top-player .player-wrapper');
  const titleSpan = document.getElementById('archive-player-title');

  if (!playerArea || !playerWrapper) return;

  // BGM 일시정지 (설교 영상 시청 시 방해 방지)
  pauseBgm();

  // 비디오 ID 추출
  let videoId = extractYouTubeId(item.url);
  
  // 만약 개별 videoId가 등록되지 않은 경우 불로열방교회 대표 영상 ID로 안전하게 폴백
  if (!videoId) {
    if (archiveDataCache && archiveDataCache[folderKey] && archiveDataCache[folderKey].playlistUrl) {
      videoId = extractYouTubeId(archiveDataCache[folderKey].playlistUrl);
    }
    if (!videoId) {
      videoId = 'Go4OwdYguN0'; // 도르트 신조 및 불로열방교회 대표 기본 영상 ID
    }
  }

  if (titleSpan) titleSpan.textContent = `▶ 방영 중: ${item.title}`;

  const ytLink = document.getElementById('archive-player-yt-link');
  if (ytLink) {
    ytLink.href = item.url || `https://www.youtube.com/watch?v=${videoId}`;
  }

  const pdfLink = document.getElementById('archive-player-pdf-link');
  if (pdfLink) {
    if (item.pdfUrl) {
      pdfLink.href = item.pdfUrl;
      pdfLink.style.display = 'inline-flex';
    } else {
      pdfLink.style.display = 'none';
    }
  }

  const startTime = extractStartTime(item.url, item);
  const startParam = startTime > 0 ? `&start=${startTime}` : '';

  // 클릭 시 즉시 영상 재생 iframe 주입
  playerWrapper.innerHTML = `
    <iframe id="archive-player-iframe" 
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1${startParam}" 
      frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
      referrerpolicy="strict-origin-when-cross-origin" 
      allowfullscreen 
      title="${item.title.replace(/"/g, '&quot;')}">
    </iframe>
  `;

  playerArea.style.display = 'block';
  playerArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function extractStartTime(url, item) {
  if (item && item.startTime !== undefined && item.startTime !== null) return parseInt(item.startTime);
  if (item && item.start !== undefined && item.start !== null) return parseInt(item.start);
  if (!url) return 0;
  
  const match = url.match(/[?&]t=(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/) || url.match(/[?&]t=(\d+)/);
  if (match) {
    if (match[3] !== undefined || match[2] !== undefined || match[1] !== undefined) {
      const h = parseInt(match[1] || 0);
      const m = parseInt(match[2] || 0);
      const s = parseInt(match[3] || 0);
      return h * 3600 + m * 60 + s;
    } else if (match[1]) {
      return parseInt(match[1]);
    }
  }
  return 0;
}

function closeArchivePlayer(isFromHistory = false) {
  const playerArea = document.getElementById('archive-top-player');
  const playerWrapper = document.getElementById('archive-player-wrapper') || document.querySelector('#archive-top-player .player-wrapper');
  if (playerWrapper) {
    playerWrapper.innerHTML = '';
  }
  if (playerArea) {
    playerArea.style.display = 'none';
  }

  // 닫기 버튼 직접 클릭 시 URL 해시 정리 (단, 히스토리 되돌리기 중이 아닐 때)
  if (!isFromHistory) {
    const rawHash = window.location.hash.replace(/^#/, '');
    const parts = rawHash.split('/');
    if (parts[0] === 'sermons' && parts.length > 2) {
      const folder = parts[1] || currentFolderKey || 'ot';
      history.pushState({ pageId: 'sermons', subFolderKey: folder }, '', `#sermons/${folder}`);
    }
  }
}

async function openSermonSeriesModal(seriesKey) {
  navigateToPage('sermons', seriesKey);
}

async function openPilgrimModal() {
  navigateToPage('sermons', 'pilgrim');
}

/**
 * ==========================================================
 * 🔐 관리자 모드 인증 및 사이트 인라인 편집 모달 로직
 * ==========================================================
 */
const SITE_ADMIN_PIN = '7777';

function openAdminLoginModal() {
  if (isSiteAdminLoggedIn()) {
    window.location.href = 'admin.html';
    return;
  }
  const modal = document.getElementById('modal-admin-login');
  if (modal) {
    modal.classList.add('active');
    setTimeout(() => {
      const pinInput = document.getElementById('site-admin-pin-input');
      if (pinInput) pinInput.focus();
    }, 100);
  }
}

function closeAdminLoginModal() {
  const modal = document.getElementById('modal-admin-login');
  if (modal) modal.classList.remove('active');
}

function handleSiteAdminLogin(e) {
  e.preventDefault();
  const pin = document.getElementById('site-admin-pin-input').value.trim();
  if (pin === SITE_ADMIN_PIN) {
    localStorage.setItem('allnations_admin_auth', 'true');
    closeAdminLoginModal();
    updateSiteAdminUI();
    alert('🎉 관리자 모드로 로그인되었습니다!\n이제 홈페이지 상에서 설교 및 폴더를 실시간으로 직접 수정/추가하실 수 있습니다.');
  } else {
    alert('비밀번호가 올바르지 않습니다. (기본: 7777)');
  }
}

function handleSiteAdminLogout() {
  if (!confirm('관리자 모드를 로그아웃하고 일반 사용자 모드로 전환하시겠습니까?')) return;
  localStorage.removeItem('allnations_admin_auth');
  updateSiteAdminUI();
  alert('관리자 모드에서 로그아웃되었습니다.');
}

// 시간 파싱 및 포맷 유틸리티
function parseTimeToSeconds(input) {
  if (input === undefined || input === null) return 0;
  const str = String(input).trim();
  if (!str) return 0;

  // 순수 숫자 (초 단위)
  if (/^\d+$/.test(str)) {
    return parseInt(str, 10);
  }

  // 1:23:45 (시:분:초) 또는 24:30 (분:초)
  const colonParts = str.split(':').map(p => parseInt(p.trim(), 10) || 0);
  if (colonParts.length === 3) {
    return colonParts[0] * 3600 + colonParts[1] * 60 + colonParts[2];
  } else if (colonParts.length === 2) {
    return colonParts[0] * 60 + colonParts[1];
  }

  // "24분 30초" 또는 "24분" 등 한글 형식
  const minMatch = str.match(/(\d+)\s*분/);
  const secMatch = str.match(/(\d+)\s*초/);
  if (minMatch || secMatch) {
    const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
    const secs = secMatch ? parseInt(secMatch[1], 10) : 0;
    return mins * 60 + secs;
  }

  return parseInt(str.replace(/[^0-9]/g, ''), 10) || 0;
}

function formatSecondsToTime(totalSec) {
  const sec = parseInt(totalSec, 10) || 0;
  if (sec <= 0) return '0:00';
  const hours = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const remainingSec = sec % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(remainingSec).padStart(2, '0')}`;
  }
  return `${mins}:${String(remainingSec).padStart(2, '0')}`;
}

function handleStartTimeInput(val) {
  const sec = parseTimeToSeconds(val);
  const badge = document.getElementById('modal-lec-time-badge');
  if (badge) {
    if (sec > 0) {
      const formatted = formatSecondsToTime(sec);
      badge.textContent = `${formatted} (${sec.toLocaleString()}초부터 재생)`;
      badge.style.background = '#15803d';
    } else {
      badge.textContent = '0초(처음)부터 재생';
      badge.style.background = '#64748b';
    }
  }
}

function setQuickStartTime(timeStr) {
  const input = document.getElementById('modal-lec-starttime');
  if (input) {
    input.value = timeStr;
    handleStartTimeInput(timeStr);
  }
}

function previewModalStartTime() {
  const urlInput = document.getElementById('modal-lec-url');
  const timeInput = document.getElementById('modal-lec-starttime');
  const url = urlInput ? urlInput.value.trim() : '';
  const vid = extractYouTubeId(url);
  const sec = parseTimeToSeconds(timeInput ? timeInput.value : '');

  if (!vid) {
    alert('유튜브 영상 링크를 먼저 올바르게 입력해 주세요.');
    return;
  }

  const testUrl = `https://www.youtube.com/watch?v=${vid}&t=${sec}s`;
  window.open(testUrl, '_blank');
}

// 1. 설교 등록/수정 모달 열기
function openLectureAddModal(folderKey) {
  const modal = document.getElementById('modal-lecture-edit');
  const select = document.getElementById('modal-lec-folder-select');
  const folders = getEffectiveFolders();

  select.innerHTML = folders.map(f => `<option value="${f.key}">${f.title}</option>`).join('');
  select.value = folderKey || currentFolderKey;

  document.getElementById('modal-lecture-title-text').textContent = '➕ 새 설교 영상 및 자료 등록';
  document.getElementById('modal-lec-mode').value = 'add';
  document.getElementById('modal-lec-original-ep').value = '';

  // 다음 회차 자동 계산
  let nextEp = 1;
  if (archiveDataCache && archiveDataCache[select.value] && archiveDataCache[select.value].episodes) {
    const list = archiveDataCache[select.value].episodes;
    if (list.length > 0) {
      nextEp = Math.max(...list.map(x => x.ep || 0)) + 1;
    }
  }

  document.getElementById('modal-lec-ep').value = nextEp;
  document.getElementById('modal-lec-title').value = '';
  document.getElementById('modal-lec-passage').value = '';
  document.getElementById('modal-lec-url').value = '';
  document.getElementById('modal-lec-pdf').value = '';

  const startInput = document.getElementById('modal-lec-starttime');
  if (startInput) {
    startInput.value = '';
    handleStartTimeInput('');
  }

  modal.classList.add('active');
}

function openLectureEditModal(folderKey, epNumber) {
  if (!archiveDataCache || !archiveDataCache[folderKey]) return;
  const num = parseInt(epNumber);
  const item = (archiveDataCache[folderKey].episodes || []).find(x => 
    x.ep === epNumber || 
    x.ep === num || 
    String(x.ep) === String(epNumber) || 
    (x.ep + '강') === String(epNumber) ||
    (typeof x.ep === 'string' && x.ep.replace(/[^0-9]/g, '') === String(epNumber).replace(/[^0-9]/g, ''))
  );
  if (!item) return;

  const modal = document.getElementById('modal-lecture-edit');
  const select = document.getElementById('modal-lec-folder-select');
  const folders = getEffectiveFolders();

  select.innerHTML = folders.map(f => `<option value="${f.key}">${f.title}</option>`).join('');
  select.value = folderKey;

  document.getElementById('modal-lecture-title-text').textContent = `✏️ 설교 영상 수정 (${item.ep}강)`;
  document.getElementById('modal-lec-mode').value = 'edit';
  document.getElementById('modal-lec-original-ep').value = epNumber;

  document.getElementById('modal-lec-ep').value = item.ep;
  document.getElementById('modal-lec-title').value = item.title || '';
  document.getElementById('modal-lec-passage').value = item.passage || '';
  document.getElementById('modal-lec-url').value = item.url || '';
  document.getElementById('modal-lec-pdf').value = item.pdfUrl || '';

  const startInput = document.getElementById('modal-lec-starttime');
  if (startInput) {
    const rawTime = item.startTime !== undefined && item.startTime !== null ? item.startTime : extractStartTime(item.url, item);
    const formatted = rawTime > 0 ? formatSecondsToTime(rawTime) : '';
    startInput.value = formatted;
    handleStartTimeInput(formatted);
  }

  modal.classList.add('active');
}

function closeLectureEditModal() {
  const modal = document.getElementById('modal-lecture-edit');
  if (modal) modal.classList.remove('active');
}

function handleSaveSiteLecture(e) {
  e.preventDefault();
  const folderKey = document.getElementById('modal-lec-folder-select').value;
  const mode = document.getElementById('modal-lec-mode').value;
  const origEp = document.getElementById('modal-lec-original-ep').value;
  const ep = parseInt(document.getElementById('modal-lec-ep').value);
  const title = document.getElementById('modal-lec-title').value.trim();
  const passage = document.getElementById('modal-lec-passage').value.trim();
  let url = document.getElementById('modal-lec-url').value.trim();
  const pdfUrl = document.getElementById('modal-lec-pdf').value.trim();
  const startTimeInput = document.getElementById('modal-lec-starttime');
  const startSec = startTimeInput ? parseTimeToSeconds(startTimeInput.value) : 0;

  if (!archiveDataCache) archiveDataCache = {};
  if (!archiveDataCache[folderKey]) {
    const folders = getEffectiveFolders();
    const meta = folders.find(f => f.key === folderKey);
    archiveDataCache[folderKey] = {
      title: meta ? meta.title : folderKey,
      episodes: []
    };
  }

  const epList = archiveDataCache[folderKey].episodes;

  // URL 내 시간 파라미터 자동 동기화
  if (url && startSec > 0) {
    if (/[?&](?:t|start)=\d+s?/.test(url)) {
      url = url.replace(/([?&](?:t|start)=)\d+s?/, `$1${startSec}s`);
    } else {
      url += (url.includes('?') ? '&' : '?') + `t=${startSec}s`;
    }
  }

  const newItem = {
    ep: ep,
    title: title,
    passage: passage,
    url: url,
    startTime: startSec > 0 ? startSec : 0,
    pdfUrl: pdfUrl || null
  };

  if (mode === 'add') {
    // 중복 체크
    const idx = epList.findIndex(x => x.ep === ep || String(x.ep) === String(ep));
    if (idx !== -1) {
      if (!confirm(`${ep}강이 이미 존재합니다. 덮어쓰시겠습니까?`)) return;
      epList[idx] = newItem;
    } else {
      epList.push(newItem);
    }
  } else {
    // edit 모드
    const origNum = parseInt(origEp);
    const idx = epList.findIndex(x => x.ep === origEp || x.ep === origNum || String(x.ep) === String(origEp));
    if (idx !== -1) {
      epList[idx] = newItem;
    } else {
      epList.push(newItem);
    }
  }

  // 회차별 오름차순 정렬
  epList.sort((a, b) => (parseInt(a.ep) || 0) - (parseInt(b.ep) || 0));

  saveEffectiveData();
  closeLectureEditModal();
  renderArchiveFolderSidebar();
  renderArchiveFolderContent(folderKey, '');
  alert(`🎉 '${title}' 설교가 성공적으로 저장되었습니다!\n시작 재생 시간: ${startSec > 0 ? formatSecondsToTime(startSec) + ` (${startSec}초)` : '처음부터'}\n(우측 상단의 [🚀 GitHub 영구 저장]을 누르시면 전세계 배포가 완료됩니다)`);
}

function handleDeleteSiteLecture(folderKey, epNumber) {
  if (!confirm(`${epNumber}강 설교를 정말로 삭제하시겠습니까?`)) return;
  if (!archiveDataCache || !archiveDataCache[folderKey]) return;

  const list = archiveDataCache[folderKey].episodes || [];
  const num = parseInt(epNumber);
  const idx = list.findIndex(x => x.ep === epNumber || x.ep === num || String(x.ep) === String(epNumber));
  if (idx !== -1) {
    list.splice(idx, 1);
    saveEffectiveData();
    renderArchiveFolderSidebar();
    renderArchiveFolderContent(folderKey, '');
    alert('설교가 삭제되었습니다.');
  }
}

// 2. 새 폴더 등록 모달 열기
function openFolderCreateModal() {
  const modal = document.getElementById('modal-folder-create');
  if (modal) {
    document.getElementById('modal-folder-key').value = '';
    document.getElementById('modal-folder-title').value = '';
    modal.classList.add('active');
  }
}

function closeFolderCreateModal() {
  const modal = document.getElementById('modal-folder-create');
  if (modal) modal.classList.remove('active');
}

function handleSaveSiteFolder(e) {
  e.preventDefault();
  const key = document.getElementById('modal-folder-key').value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const title = document.getElementById('modal-folder-title').value.trim();
  const icon = document.getElementById('modal-folder-icon').value;

  if (!key || !title) {
    alert('폴더 식별 키와 이름을 모두 입력해 주세요.');
    return;
  }

  activeFoldersList = getEffectiveFolders();
  if (activeFoldersList.some(f => f.key === key)) {
    alert('이미 존재하는 폴더 키입니다. 다른 키를 입력해 주세요.');
    return;
  }

  const newFolder = {
    key: key,
    title: title,
    count: '0편',
    icon: icon,
    bgClass: 'bg-nt'
  };

  activeFoldersList.push(newFolder);
  if (!archiveDataCache) archiveDataCache = {};
  archiveDataCache[key] = {
    title: title,
    episodes: []
  };

  saveEffectiveData();
  closeFolderCreateModal();
  currentFolderKey = key;
  renderArchiveFolderSidebar();
  renderArchiveFolderContent(key, '');
  alert(`🎉 '${title}' 폴더가 생성되었습니다!`);
}

function handleDeleteSiteFolder(e, folderKey) {
  e.stopPropagation();
  if (!confirm(`'${folderKey}' 폴더와 폴더 안의 모든 설교를 삭제하시겠습니까?`)) return;

  activeFoldersList = getEffectiveFolders().filter(f => f.key !== folderKey);
  if (archiveDataCache && archiveDataCache[folderKey]) {
    delete archiveDataCache[folderKey];
  }

  saveEffectiveData();
  currentFolderKey = activeFoldersList[0] ? activeFoldersList[0].key : 'ot';
  renderArchiveFolderSidebar();
  renderArchiveFolderContent(currentFolderKey, '');
  alert('폴더가 삭제되었습니다.');
}

// 3. GitHub 즉시 배포 (사이트 모드에서 원클릭)
const DEFAULT_GH_REPO = 'kpuritan/allnationschurch';
const DEFAULT_GH_BRANCH = 'main';

function getStoredGitHubConfig() {
  const savedV1 = localStorage.getItem('ALLNATIONS_GH_SETTINGS_V1');
  const savedV0 = localStorage.getItem('ALLNATIONS_GH_SETTINGS');
  let cfg = { repo: DEFAULT_GH_REPO, branch: DEFAULT_GH_BRANCH, token: '' };
  try {
    if (savedV1) {
      cfg = { ...cfg, ...JSON.parse(savedV1) };
    } else if (savedV0) {
      cfg = { ...cfg, ...JSON.parse(savedV0) };
    }
  } catch (e) {
    console.error(e);
  }
  return cfg;
}

function saveStoredGitHubConfig(cfg) {
  localStorage.setItem('ALLNATIONS_GH_SETTINGS_V1', JSON.stringify(cfg));
  localStorage.setItem('ALLNATIONS_GH_SETTINGS', JSON.stringify(cfg));
}

function utf8ToB64(str) {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode('0x' + p1)));
}

async function syncSiteChangesToGitHub() {
  const btn = document.getElementById('btn-site-sync');
  const origText = btn ? btn.innerHTML : '';

  let cfg = getStoredGitHubConfig();
  let token = cfg.token;
  let repo = cfg.repo || DEFAULT_GH_REPO;
  let branch = cfg.branch || DEFAULT_GH_BRANCH;

  if (!token) {
    const inputToken = prompt(
      "🔑 GitHub 개인 액세스 토큰(PAT)이 필요합니다.\n\nGitHub에서 발급받은 토큰(ghp_...)을 입력해 주세요:\n(입력하시면 브라우저에 저장되어 다음부터는 1-클릭으로 바로 배포됩니다)\n\n※ 로컬 컴퓨터에서는 폴더 안의 '동기화_배포하기.bat' 파일을 더블 클릭하셔도 즉시 배포됩니다."
    );
    if (!inputToken || !inputToken.trim()) {
      return;
    }
    token = inputToken.trim();
    cfg.token = token;
    saveStoredGitHubConfig(cfg);
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '⏳ 깃허브 배포 중...';
  }

  try {
    let currentSha = null;
    const path = 'data/sermons_archive.json';

    try {
      const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}?ref=${branch}&t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (getRes.ok) {
        const fileData = await getRes.json();
        currentSha = fileData.sha;
      }
    } catch (e) {
      console.warn('SHA fetch skipped', e);
    }

    const bodyPayload = {
      message: `Update sermons_archive.json from Site Live Edit (${new Date().toLocaleString('ko-KR')})`,
      content: utf8ToB64(JSON.stringify(archiveDataCache, null, 2)),
      branch: branch
    };
    if (currentSha) bodyPayload.sha = currentSha;

    const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyPayload)
    });

    if (!putRes.ok) {
      const err = await putRes.json();
      if (putRes.status === 401 || (err.message && err.message.toLowerCase().includes('bad credentials'))) {
        const retryToken = prompt(
          "❌ GitHub 토큰 인증 실패 (401 Unauthorized)\n\n토큰이 만료되었거나 권한(repo)이 부족합니다.\n새로운 GitHub 토큰(ghp_...)을 입력해 주시면 즉시 다시 시도합니다:\n\n※ 또는 로컬 폴더의 '동기화_배포하기.bat'을 실행하셔도 배포됩니다."
        );
        if (retryToken && retryToken.trim()) {
          cfg.token = retryToken.trim();
          saveStoredGitHubConfig(cfg);
          return syncSiteChangesToGitHub();
        }
      }
      throw new Error(err.message || putRes.statusText);
    }

    alert('🎉 GitHub 저장소에 성공적으로 영구 저장(Commit)되었습니다!\n약 1~2분 뒤 전세계 모든 기기에 자동 배포가 완료됩니다.');
  } catch (err) {
    alert('GitHub 배포 실패: ' + err.message + "\n\n💡 팁: 로컬 폴더의 '동기화_배포하기.bat' 파일을 실행하시면 토큰 없이도 간편하게 깃허브로 배포할 수 있습니다.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origText;
    }
  }
}

/**
 * ==========================================================
 * 🎵 BGM 찬양 플레이어 (YouTube Background Music Player)
 * 비디오: [Deep Sleep] 잠들며 듣는 찬송가 (uJ0X0uV5RNE)
 * ==========================================================
 */
let ytBgmPlayer = null;
let isBgmPlaying = false;
let isBgmMuted = false;
const BGM_VIDEO_ID = 'uJ0X0uV5RNE';

function onYouTubeIframeAPIReady() {
  ytBgmPlayer = new YT.Player('yt-bgm-player', {
    videoId: BGM_VIDEO_ID,
    playerVars: {
      autoplay: 0,
      loop: 1,
      playlist: BGM_VIDEO_ID,
      controls: 0,
      disablekb: 1,
      modestbranding: 1,
      rel: 0
    },
    events: {
      onReady: onBgmPlayerReady,
      onStateChange: onBgmPlayerStateChange
    }
  });
}

function onBgmPlayerReady(event) {
  event.target.setVolume(50);
}

function onBgmPlayerStateChange(event) {
  const disc = document.getElementById('bgm-disc');
  const toggleBtn = document.getElementById('btn-bgm-toggle');

  if (event.data === YT.PlayerState.PLAYING) {
    isBgmPlaying = true;
    if (disc) disc.classList.add('spinning');
    if (toggleBtn) toggleBtn.textContent = '⏸';
  } else {
    isBgmPlaying = false;
    if (disc) disc.classList.remove('spinning');
    if (toggleBtn) toggleBtn.textContent = '▶';
  }
}

function toggleBgmPlay() {
  if (!ytBgmPlayer || !ytBgmPlayer.playVideo) return;
  if (isBgmPlaying) {
    ytBgmPlayer.pauseVideo();
  } else {
    ytBgmPlayer.playVideo();
  }
}

function pauseBgm() {
  if (ytBgmPlayer && isBgmPlaying && ytBgmPlayer.pauseVideo) {
    ytBgmPlayer.pauseVideo();
  }
}

function toggleBgmMute() {
  if (!ytBgmPlayer) return;
  const muteBtn = document.getElementById('btn-bgm-mute');
  if (isBgmMuted) {
    ytBgmPlayer.unMute();
    isBgmMuted = false;
    if (muteBtn) muteBtn.textContent = '🔊';
  } else {
    ytBgmPlayer.mute();
    isBgmMuted = true;
    if (muteBtn) muteBtn.textContent = '🔇';
  }
}

function toggleBgmWidget() {
  const widget = document.getElementById('bgm-player-widget');
  if (widget) {
    widget.classList.toggle('minimized');
  }
}

function initBgmOnFirstInteraction() {
  // 사용자가 페이지를 처음 클릭할 때 볼륨 세팅 및 필요 시 부드럽게 초기화
  if (ytBgmPlayer && ytBgmPlayer.setVolume) {
    ytBgmPlayer.setVolume(50);
  }
}

/**
 * ==========================================================
 * 🔄 SPA 브라우저 뒤로가기/앞으로가기 히스토리 라우터 (Popstate Router)
 * ==========================================================
 */
function handleInitialRoute() {
  const rawHash = window.location.hash.replace(/^#/, '');
  if (!rawHash || rawHash === 'home') {
    history.replaceState({ pageId: 'home' }, '', '#home');
    navigateToPage('home', null, true);
    return;
  }

  const parts = rawHash.split('/');
  const pageId = parts[0] || 'home';
  const subKey = parts[1] || null;
  const epParam = parts[2] ? decodeURIComponent(parts[2]) : null;

  history.replaceState({ pageId, subFolderKey: subKey, ep: epParam }, '', '#' + rawHash);
  navigateToPage(pageId, subKey, true);

  if (pageId === 'sermons' && subKey) {
    if (epParam) {
      setTimeout(() => {
        playArchiveLecture(subKey, epParam, true);
      }, 300);
    }
  }
}

// 브라우저 뒤로가기(←) 및 앞으로가기(→) 이벤트 처리
window.addEventListener('popstate', (event) => {
  // 1. 활성화된 팝업 모달이 열려있다면 모달을 먼저 닫아줌
  const openModals = document.querySelectorAll('.site-modal-overlay.active');
  if (openModals.length > 0) {
    openModals.forEach(m => m.classList.remove('active'));
    return;
  }

  // 2. URL 해시 분석하여 해당 페이지와 강해 폴더로 부드럽게 복원
  const rawHash = window.location.hash.replace(/^#/, '');
  if (!rawHash || rawHash === 'home') {
    closeArchivePlayer(true);
    navigateToPage('home', null, true);
    return;
  }

  const parts = rawHash.split('/');
  const pageId = parts[0] || 'home';
  const subKey = parts[1] || null;
  const epParam = parts[2] ? decodeURIComponent(parts[2]) : null;

  navigateToPage(pageId, subKey, true);

  if (pageId === 'sermons' && subKey) {
    selectArchiveFolder(subKey, true);
    if (epParam) {
      playArchiveLecture(subKey, epParam, true);
    } else {
      closeArchivePlayer(true);
    }
  } else {
    closeArchivePlayer(true);
  }
});





