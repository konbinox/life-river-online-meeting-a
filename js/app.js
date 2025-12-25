// js/app.js - 主页面逻辑
let meetingData = null;
let currentPageKey = null;

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1600);
}

// 载入 meeting.json
fetch('data/meeting.json')
  .then(res => res.json())
  .then(data => {
    meetingData = data;
    buildSidebarFromMeeting(data);
    // 默认选第一页
    const firstKey = Object.keys(data.pages)[0];
    if (firstKey) {
      selectPage(firstKey);
    }
  })
  .catch(err => {
    console.error(err);
    showToast('載入 meeting.json 失敗');
    // 如果加载失败，创建示例导航
    createSampleNavigation();
  });

// 构建导航
function buildSidebarFromMeeting(data) {
  const sidebar = document.getElementById('sidebar');
  const pages = data.pages;
  let pageNumber = 1;
  
  Object.keys(pages).forEach(key => {
    const page = pages[key];
    const navItem = createNavElement(key, page, pageNumber);
    sidebar.appendChild(navItem);
    pageNumber++;
  });
}

// 创建单个导航元素
function createNavElement(key, page, pageNumber) {
  const navItem = document.createElement('div');
  navItem.className = 'nav-number';
  navItem.dataset.pageKey = key;
  
  // 编号圆圈
  const numberCircle = document.createElement('div');
  numberCircle.className = 'number-circle';
  numberCircle.textContent = pageNumber;
  
  // 内容容器
  const contentDiv = document.createElement('div');
  contentDiv.className = 'nav-content';
  
  // 标题
  const title = document.createElement('div');
  title.className = 'nav-title';
  title.textContent = page.title || `頁面 ${pageNumber}`;
  
  // 描述
  const desc = document.createElement('div');
  desc.className = 'nav-desc';
  desc.textContent = page.description || '點擊查看詳情';
  
  contentDiv.appendChild(title);
  contentDiv.appendChild(desc);
  
  navItem.appendChild(numberCircle);
  navItem.appendChild(contentDiv);
  navItem.addEventListener('click', () => selectPage(key));
  
  return navItem;
}

// 创建示例导航（当meeting.json加载失败时）
function createSampleNavigation() {
  const sidebar = document.getElementById('sidebar');
  const sampleTitles = [
    "數據頁面",
    "新朋友歡迎",
    "同工代表",
    "敬拜貴重",
    "敬拜尊貴",
    "新稱呼里",
    "大幫見證",
    "主日回顧",
    "活動分享",
    "本店名義",
    "文秘報告",
    "領袖學院",
    "烈火報告",
    "二維碼",
    "代禱事項"
  ];
  
  for (let i = 0; i < sampleTitles.length; i++) {
    const navItem = document.createElement('div');
    navItem.className = 'nav-number';
    navItem.dataset.pageKey = `sample_${i + 1}`;
    
    const numberCircle = document.createElement('div');
    numberCircle.className = 'number-circle';
    numberCircle.textContent = i + 1;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'nav-content';
    
    const title = document.createElement('div');
    title.className = 'nav-title';
    title.textContent = sampleTitles[i];
    
    const desc = document.createElement('div');
    desc.className = 'nav-desc';
    desc.textContent = '示例描述文字';
    
    contentDiv.appendChild(title);
    contentDiv.appendChild(desc);
    
    navItem.appendChild(numberCircle);
    navItem.appendChild(contentDiv);
    
    navItem.addEventListener('click', () => {
      showToast(`示例頁面 ${i + 1} - ${sampleTitles[i]}`);
    });
    
    sidebar.appendChild(navItem);
  }
}

function selectPage(pageKey) {
  if (!meetingData || !meetingData.pages[pageKey]) return;
  currentPageKey = pageKey;

  // 激活样式
  document.querySelectorAll('.nav-number').forEach(item => {
    item.classList.toggle('active', item.dataset.pageKey === pageKey);
  });

  const page = meetingData.pages[pageKey];
  renderPage(page);
  
  // 把当前页信息同步到 localStorage，给 editor 用
  localStorage.setItem('current-page-key', pageKey);
  localStorage.setItem('meeting-data', JSON.stringify(meetingData));
  
  // 显示提示
  const pageNumber = Array.from(document.querySelectorAll('.nav-number'))
    .findIndex(item => item.dataset.pageKey === pageKey) + 1;
  showToast(`第 ${pageNumber} 頁：${page.title}`);
}

function renderPage(page) {
  const main = document.getElementById('main');
  const container = document.getElementById('main-content');
  container.innerHTML = '';

  // 背景
  if (page.background) {
    main.style.backgroundImage = `url('assets/images/${page.background}')`;
  } else {
    main.style.backgroundImage = 'none';
  }

  // 标题
  const titleEl = document.createElement('h1');
  titleEl.className = 'page-title';
  titleEl.textContent = page.title || '';
  container.appendChild(titleEl);

  // sections
  (page.sections || []).forEach(section => {
    const wrapper = document.createElement('div');
    wrapper.className = 'section';

    let el;
    switch (section.type) {
      case 'text':
        el = document.createElement('div');
        el.innerHTML = section.content || '';
        break;
      case 'image':
        el = document.createElement('img');
        el.src = section.content || '';
        break;
      case 'video':
        el = document.createElement('iframe');
        el.src = section.content || '';
        el.width = '100%';
        el.height = '400';
        el.allowFullscreen = true;
        break;
      case 'title':
        el = document.createElement('h2');
        el.innerHTML = section.content || '';
        break;
      case 'quote':
        el = document.createElement('blockquote');
        el.innerHTML = section.content || '';
        break;
      default:
        el = document.createElement('div');
        el.innerHTML = section.content || '';
    }

    // 应用样式
    if (section.style) {
      Object.assign(el.style, section.style);
    }

    wrapper.appendChild(el);
    container.appendChild(wrapper);
  });
}

// 齿轮按钮：打开/关闭编辑器
const gearBtn = document.getElementById('gear-btn');
const editorPanel = document.getElementById('editor-panel');

gearBtn.addEventListener('click', () => {
  const isOpen = editorPanel.classList.contains('open');
  if (!isOpen && !currentPageKey) {
    showToast('請先選擇一個頁面');
    return;
  }
  editorPanel.classList.toggle('open');
  if (!isOpen) {
    showToast('正在編輯：' + currentPageKey);
  }
});

// 监听 editor 写回的 meeting-data（localStorage）
window.addEventListener('storage', (e) => {
  if (e.key === 'meeting-data' && e.newValue) {
    try {
      meetingData = JSON.parse(e.newValue);
      if (currentPageKey && meetingData.pages[currentPageKey]) {
        renderPage(meetingData.pages[currentPageKey]);
        showToast('已從編輯器更新內容');
        
        // 更新导航显示（如果标题或描述有变化）
        const navItem = document.querySelector(`.nav-number[data-page-key="${currentPageKey}"]`);
        if (navItem) {
          const page = meetingData.pages[currentPageKey];
          const titleEl = navItem.querySelector('.nav-title');
          const descEl = navItem.querySelector('.nav-desc');
          if (titleEl && page.title) titleEl.textContent = page.title;
          if (descEl && page.description) descEl.textContent = page.description;
        }
      }
    } catch (err) {
      console.error(err);
    }
  }
});