/**
 * 불로 열방교회 홈페이지 자체 글 관리 시스템
 * posts/posts.json 에서 글을 불러와 표시합니다
 */

let allPosts = [];
let currentCategory = 'all';

// 날짜 포맷
function formatDate(dateStr) {
  return dateStr || '';
}

// 글 목록 불러오기
async function fetchPosts() {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  container.innerHTML = `
    <div class="blog-loading">
      <div class="spinner"></div>
      <p>말씀을 불러오는 중입니다...</p>
    </div>
  `;

  try {
    const response = await fetch('posts/posts.json?t=' + Date.now());
    if (!response.ok) throw new Error('파일을 불러올 수 없습니다');
    allPosts = await response.json();
    // 최신 글이 위로
    allPosts.sort((a, b) => b.date.localeCompare(a.date));
  } catch (err) {
    console.error('글 불러오기 실패:', err);
    allPosts = [];
  }

  renderPosts();
}

// 글 카드 렌더링
function renderPosts() {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  const filtered = currentCategory === 'all'
    ? allPosts
    : allPosts.filter(p => p.category.includes(currentCategory) || p.title.includes(currentCategory));

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="blog-loading">
        <p>등록된 글이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(post => `
    <article class="blog-card" onclick="openPost('${post.id}')" style="cursor:pointer;">
      <div class="blog-card-thumb">
        <span class="blog-card-thumb-badge">${post.category}</span>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.35">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/><path d="M6 10h10"/>
        </svg>
      </div>
      <div class="blog-card-body">
        <span class="blog-card-category">${post.category}</span>
        <h3 class="blog-card-title">${post.title}</h3>
        <p class="blog-card-snippet">${post.summary}</p>
        <div class="blog-card-footer">
          <span class="blog-card-date">📅 ${post.date}</span>
          <span class="blog-card-link-btn">자세히 보기 ➔</span>
        </div>
      </div>
    </article>
  `).join('');
}

// 글 상세보기 (모달)
function openPost(id) {
  const post = allPosts.find(p => p.id === id);
  if (!post) return;

  // 기존 모달 제거
  const existing = document.getElementById('post-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'post-modal';
  modal.style.cssText = `
    position:fixed; top:0; left:0; width:100%; height:100%;
    background:rgba(0,0,0,0.6); z-index:9999;
    display:flex; align-items:center; justify-content:center;
    padding: 1rem;
  `;

  const contentHtml = post.content
    .split('\n')
    .map(line => line.trim() ? `<p style="margin-bottom:1rem; line-height:1.8;">${line}</p>` : '<br>')
    .join('');

  modal.innerHTML = `
    <div style="background:#fff; border-radius:16px; max-width:700px; width:100%;
      max-height:85vh; overflow-y:auto; padding:2rem; position:relative;">
      <button onclick="document.getElementById('post-modal').remove()"
        style="position:absolute; top:1rem; right:1rem; background:none; border:none;
        font-size:1.5rem; cursor:pointer; color:#666;">✕</button>
      <span style="display:inline-block; background:#e8f0e8; color:#2d5a2d;
        padding:0.3rem 0.8rem; border-radius:20px; font-size:0.8rem; margin-bottom:1rem;">
        ${post.category}
      </span>
      <h2 style="font-size:1.4rem; font-weight:800; color:#1a2e1a; margin-bottom:0.5rem; line-height:1.4;">
        ${post.title}
      </h2>
      <p style="color:#888; font-size:0.9rem; margin-bottom:1.5rem;">📅 ${post.date}</p>
      <hr style="border:none; border-top:1px solid #eee; margin-bottom:1.5rem;">
      <div style="color:#333; font-size:0.97rem;">${contentHtml}</div>
    </div>
  `;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

// 필터 탭
function setupFilterTabs() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      renderPosts();
    });
  });
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  setupFilterTabs();
  fetchPosts();
});
