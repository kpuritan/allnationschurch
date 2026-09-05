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

/**
 * 전체 강해 시리즈 상세 목록 모달 뷰어
 * (요한복음, 로마서, 구약 권별개관, 도르트신조, 누가복음, 히브리서, 창세기, 사도행전 등)
 */
let allSeriesArchiveData = null;

async function openSermonSeriesModal(seriesKey) {
  const existing = document.getElementById('series-modal');
  if (existing) existing.remove();

  if (!allSeriesArchiveData) {
    try {
      const res = await fetch('data/sermons_archive.json?v=' + Date.now());
      if (res.ok) {
        allSeriesArchiveData = await res.json();
      }
    } catch (e) {
      console.error('시리즈 아카이브 로드 실패', e);
    }
  }

  const series = (allSeriesArchiveData && allSeriesArchiveData[seriesKey]) || null;
  if (!series) {
    // 만약 데이터가 없으면 유튜브 검색으로 안내
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent('불로열방교회 ' + seriesKey)}`, '_blank');
    return;
  }

  const modal = document.createElement('div');
  modal.id = 'series-modal';
  modal.className = 'pilgrim-modal-backdrop';

  const thumbHtml = series.thumb 
    ? `<img src="${series.thumb}" alt="${series.title}">` 
    : `<div class="video-thumb-placeholder bg-${seriesKey}" style="width:100%; height:100%;">
         <span class="thumb-topic">${series.category}</span>
         <span class="thumb-korean">${series.title}</span>
       </div>`;

  modal.innerHTML = `
    <div class="pilgrim-modal-container">
      <button type="button" class="pilgrim-modal-close" onclick="closeSeriesModal()">✕</button>
      
      <!-- 인라인 비디오 플레이어 영역 (클릭 시 즉시 방영) -->
      <div id="series-video-player-area" style="display:none; background:#000; width:100%; position:relative;">
        <div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
          <iframe id="series-video-iframe" src="" style="position:absolute; top:0; left:0; width:100%; height:100%; border:0;" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
        </div>
        <div id="series-video-bar" style="padding:0.75rem 1.2rem; background:#1e293b; color:#fff; display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
          <span id="series-now-playing-title" style="font-weight:700;">방영 중: ...</span>
          <button type="button" onclick="closePlayerArea()" style="background:#334155; color:#fff; border:none; padding:0.3rem 0.7rem; border-radius:4px; cursor:pointer; font-size:0.8rem;">플레이어 닫기 ✕</button>
        </div>
      </div>

      <div class="pilgrim-modal-header" id="series-modal-header-info">
        <div class="pilgrim-header-thumb">
          ${thumbHtml}
        </div>
        <div class="pilgrim-header-info">
          <span class="pilgrim-header-badge">${series.category} · ${series.speaker}</span>
          <h2 class="pilgrim-header-title">${series.title}</h2>
          <p class="pilgrim-header-desc">
            ${series.desc}
          </p>
        </div>
      </div>

      <!-- 모달 내 탭 & 검색 -->
      <div class="pilgrim-controls">
        <div class="pilgrim-tabs">
          <span style="font-size: 0.9rem; font-weight: 700; color: var(--primary); display: flex; align-items: center; gap: 6px;">
            📋 전체 강해 목록 (총 ${series.episodes.length}편) · 클릭 시 즉시 방영
          </span>
        </div>
        <div class="pilgrim-search-box">
          <input type="text" id="series-search-input" placeholder="회차, 제목, 본문 검색 (예: 1강, 십자가, 1장)..." />
        </div>
      </div>

      <!-- 강의 리스트 그리드 -->
      <div class="pilgrim-lecture-list" id="series-lecture-list">
        <!-- 동적 렌더링 -->
      </div>

      <div class="pilgrim-modal-footer">
        <span>© 불로 열방교회 공식 말씀 아카이브</span>
        <a href="${series.playlistUrl || ('https://www.youtube.com/results?search_query=' + encodeURIComponent(series.searchKeyword))}" target="_blank" rel="noopener noreferrer" class="btn-yt-direct">
          ▶ 유튜브에서 '${series.title}' ${series.playlistUrl ? '재생목록 바로가기' : '전체 채널 바로가기'}
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  // 배경 클릭 시 닫기
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSeriesModal();
    }
  });

  // 렌더링 실행
  renderSeriesEpisodes(series, '');

  // 검색 이벤트
  const searchInput = document.getElementById('series-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSeriesEpisodes(series, e.target.value.trim());
    });
  }
}

function renderSeriesEpisodes(series, query) {
  const container = document.getElementById('series-lecture-list');
  if (!container || !series) return;

  let episodes = series.episodes || [];

  if (query) {
    const q = query.toLowerCase();
    episodes = episodes.filter(item => 
      item.title.toLowerCase().includes(q) ||
      (item.passage && item.passage.toLowerCase().includes(q)) ||
      (item.ep + '강').includes(q) ||
      (item.ep + '편').includes(q) ||
      item.ep.toString() === q
    );
  }

  if (episodes.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 3rem; color:#888; grid-column: 1 / -1;">
        검색어에 해당하는 강의가 없습니다.
      </div>
    `;
    return;
  }

  container.innerHTML = episodes.map(item => {
    const ytUrl = item.url || (series.playlistUrl ? `${series.playlistUrl}&index=${item.ep}` : `https://www.youtube.com/results?search_query=${encodeURIComponent(item.search || ('불로열방교회 ' + series.title + ' ' + item.ep + '강 ' + item.title))}`);
    
    // 비디오 ID 추출 (있으면 내장 플레이어로 즉시 방영)
    let videoId = '';
    if (item.url && item.url.includes('v=')) {
      const match = item.url.match(/v=([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    } else if (item.url && item.url.includes('youtu.be/')) {
      const match = item.url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
      if (match) videoId = match[1];
    }

    return `
      <div class="pilgrim-item-card" onclick="handleEpisodeClick('${videoId}', '${item.title.replace(/'/g, "\\'")}', '${ytUrl}')" style="cursor:pointer;">
        <div class="p-item-left">
          <span class="p-ep-badge">${item.ep}강</span>
          <div class="p-info">
            <h4 class="p-title">${item.title}</h4>
            <div class="p-meta">
              <span class="p-passage">📖 ${item.passage}</span>
            </div>
          </div>
        </div>
        <div style="display:flex; gap:4px; align-items:center;">
          <button type="button" class="p-watch-btn" onclick="event.stopPropagation(); handleEpisodeClick('${videoId}', '${item.title.replace(/'/g, "\\'")}', '${ytUrl}')">
            <span>바로 방영</span> ▶
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function handleEpisodeClick(videoId, title, fallbackUrl) {
  if (videoId) {
    const playerArea = document.getElementById('series-video-player-area');
    const iframe = document.getElementById('series-video-iframe');
    const titleSpan = document.getElementById('series-now-playing-title');
    if (playerArea && iframe) {
      iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
      if (titleSpan) titleSpan.textContent = `▶ 방영 중: ${title}`;
      playerArea.style.display = 'block';
      playerArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
  }
  // videoId가 없거나 직접 이동 시 fallbackUrl로 즉시 새 창 열기
  window.open(fallbackUrl, '_blank');
}

function closePlayerArea() {
  const playerArea = document.getElementById('series-video-player-area');
  const iframe = document.getElementById('series-video-iframe');
  if (playerArea && iframe) {
    iframe.src = '';
    playerArea.style.display = 'none';
  }
}

function closeSeriesModal() {
  closePlayerArea();
  const modal = document.getElementById('series-modal');
  if (modal) modal.remove();
  document.body.style.overflow = '';
}


