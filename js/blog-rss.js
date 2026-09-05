/**
 * 불로 열방교회 네이버 블로그 실시간 RSS 연동 모듈
 * Blog URL: https://blog.naver.com/blallnationsch
 * RSS URL: https://rss.blog.naver.com/blallnationsch.xml
 */

const NAVER_BLOG_ID = 'blallnationsch';
const NAVER_BLOG_RSS = `https://rss.blog.naver.com/${NAVER_BLOG_ID}.xml`;

// 백업용 최신 글 데이터 (오프라인 / CORS 차단 시 fallback)
const FALLBACK_POSTS = [
  {
    title: "2023년 8월 13일 주일예배 (로마서 강해 16 - 이신칭의 복음의 귀결)",
    link: "https://blog.naver.com/blallnationsch/223651000890",
    pubDate: "2024.11.07",
    category: "로마서 강해",
    description: "2023년 8월 13일 주일예배 설교 말씀입니다. 이신칭의 복음의 귀결에 관한 말씀으로 오직 의인은 믿음으로 살리라 함과 같은 은혜를 나눕니다."
  },
  {
    title: "2023년 8월 6일 주일예배 (로마서 강해 15 - 하나님이 세우신 화목제물)",
    link: "https://blog.naver.com/blallnationsch/223651000254",
    pubDate: "2024.11.07",
    category: "로마서 강해",
    description: "2023년 8월 6일 주일예배 설교 말씀입니다. 하나님께서 세우신 화목제물 되신 예수 그리스도의 십자가 은혜를 증거합니다."
  },
  {
    title: "2023년 7월 30일 주일예배 (로마서 강해 14 - 그러나 이제는)",
    link: "https://blog.naver.com/blallnationsch/223650999185",
    pubDate: "2024.11.07",
    category: "로마서 강해",
    description: "율법 외에 하나님의 한 의가 나타났으니... '그러나 이제는' 우리에게 나타난 하나님의 의와 구원의 은혜를 묵상합니다."
  },
  {
    title: "2023년 7월 23일 주일예배 (로마서 강해 13 - 의인은 없나니 하나도 없으며)",
    link: "https://blog.naver.com/blallnationsch/223650998476",
    pubDate: "2024.11.07",
    category: "로마서 강해",
    description: "로마서 3장 말씀 강해 - 기록된 바 의인은 없나니 하나도 없으며 깨닫는 자도 없고 하나님을 찾는 자도 없는 인간의 실존과 하나님의 은혜."
  },
  {
    title: "불로 열방교회 주일예배 및 신앙고백 안내",
    link: "https://blog.naver.com/blallnationsch",
    pubDate: "상시안내",
    category: "교회소식",
    description: "웨스트민스터 신앙고백서와 하이델베르크 요리문답을 통해 성경을 바르게 해석하고 삶에 적용하는 불로 열방교회입니다."
  }
];

let allBlogPosts = [];
let currentCategory = 'all';

// 날짜 포맷 함수
function formatDate(dateStr) {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  } catch (e) {
    return dateStr;
  }
}

// HTML 태그 제거 및 텍스트 정제
function stripHtml(html) {
  if (!html) return '';
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// 네이버 블로그 RSS 피드 가져오기
async function fetchNaverBlogPosts() {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  // 로딩 상태 표시
  container.innerHTML = `
    <div class="blog-loading">
      <div class="spinner"></div>
      <p>네이버 블로그에서 최신 말씀과 소식을 불러오는 중입니다...</p>
    </div>
  `;

  // RSS 프록시 API 엔드포인트 목록 (순차적 시도)
  const proxyEndpoints = [
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(NAVER_BLOG_RSS)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(NAVER_BLOG_RSS)}`
  ];

  let fetched = false;

  for (const url of proxyEndpoints) {
    try {
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) continue;
      
      const data = await response.json();
      
      if (data.items && Array.isArray(data.items)) {
        // rss2json 구조
        allBlogPosts = data.items.map(item => ({
          title: item.title,
          link: item.link,
          pubDate: formatDate(item.pubDate),
          category: item.categories && item.categories.length > 0 ? item.categories[0] : (item.title.includes('강해') ? '로마서 강해' : '주일예배'),
          description: stripHtml(item.description || item.content).replace(/#[^\s]+/g, '').trim() || item.title
        }));
        fetched = true;
        break;
      } else if (data.contents) {
        // allorigins XML 파싱 구조
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(data.contents, "text/xml");
        const items = xmlDoc.querySelectorAll("item");
        
        if (items.length > 0) {
          allBlogPosts = Array.from(items).map(item => {
            const title = item.querySelector("title") ? item.querySelector("title").textContent : '';
            const link = item.querySelector("link") ? item.querySelector("link").textContent : '';
            const pubDate = item.querySelector("pubDate") ? formatDate(item.querySelector("pubDate").textContent) : '';
            const category = item.querySelector("category") ? item.querySelector("category").textContent : (title.includes('강해') ? '로마서 강해' : '주일예배');
            const desc = item.querySelector("description") ? stripHtml(item.querySelector("description").textContent) : '';
            return {
              title,
              link,
              pubDate,
              category,
              description: desc.replace(/#[^\s]+/g, '').trim() || title
            };
          });
          fetched = true;
          break;
        }
      }
    } catch (err) {
      console.warn('Proxy fetch attempt error:', err);
    }
  }

  // 모든 API 실패 시 Fallback 데이터 사용
  if (!fetched || allBlogPosts.length === 0) {
    allBlogPosts = FALLBACK_POSTS;
  }

  renderBlogPosts();
}

// 블로그 포스트 카드 렌더링
function renderBlogPosts() {
  const container = document.getElementById('blog-posts-container');
  if (!container) return;

  const filteredPosts = currentCategory === 'all' 
    ? allBlogPosts 
    : allBlogPosts.filter(p => p.category.includes(currentCategory) || p.title.includes(currentCategory));

  if (filteredPosts.length === 0) {
    container.innerHTML = `
      <div class="blog-loading">
        <p>해당 카테고리의 글이 없습니다.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredPosts.map(post => `
    <article class="blog-card">
      <div class="blog-card-thumb">
        <span class="blog-card-thumb-badge">네이버 블로그</span>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.35">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
          <path d="M6 6h10"/>
          <path d="M6 10h10"/>
        </svg>
      </div>
      <div class="blog-card-body">
        <span class="blog-card-category">${post.category || '말씀 강해'}</span>
        <h3 class="blog-card-title">
          <a href="${post.link}" target="_blank" rel="noopener noreferrer" title="${post.title}">
            ${post.title}
          </a>
        </h3>
        <p class="blog-card-snippet">${post.description}</p>
        <div class="blog-card-footer">
          <span class="blog-card-date">📅 ${post.pubDate}</span>
          <a href="${post.link}" target="_blank" rel="noopener noreferrer" class="blog-card-link-btn">
            블로그 읽기 ➔
          </a>
        </div>
      </div>
    </article>
  `).join('');
}

// 필터 탭 초기화
function setupFilterTabs() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.getAttribute('data-filter') || 'all';
      renderBlogPosts();
    });
  });
}

// DOM 로드 시 실행
document.addEventListener('DOMContentLoaded', () => {
  setupFilterTabs();
  fetchNaverBlogPosts();
});
