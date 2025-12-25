class MeetingApp {
  constructor() {
    this.meetingData = null;
    this.currentPageKey = 'page01';
    
    this.init();
  }
  
  async init() {
    await this.loadData();
    this.buildNavigation();
    this.setupEventListeners();
    this.setupEditorCommunication();
    this.selectPage(this.currentPageKey);
  }
  
  async loadData() {
    try {
      const response = await fetch('data/meeting.json');
      this.meetingData = await response.json();
      console.log('✅ 加載數據成功');
    } catch (error) {
      console.error('加載數據失敗:', error);
      this.createSampleData();
    }
  }
  
  buildNavigation() {
    const sidebar = document.getElementById('sidebar');
    const pages = this.meetingData.pages;
    
    const navContainer = document.createElement('div');
    navContainer.className = 'nav-numbers-container';
    
    Object.keys(pages).sort().forEach((key, index) => {
      const page = pages[key];
      const pageNum = key.replace('page', '');
      
      const navItem = document.createElement('div');
      navItem.className = 'nav-number';
      navItem.dataset.pageKey = key;
      
      navItem.innerHTML = `
        <div class="number-circle">${pageNum}</div>
        <div class="nav-content">
          <div class="nav-title">${page.title || `頁面 ${pageNum}`}</div>
          <div class="nav-desc">${page.description || '點擊查看'}</div>
        </div>
      `;
      
      navItem.addEventListener('click', () => this.selectPage(key));
      navContainer.appendChild(navItem);
    });
    
    const oldTitle = document.getElementById('sidebar-title');
    sidebar.innerHTML = '';
    sidebar.appendChild(oldTitle);
    sidebar.appendChild(navContainer);
  }
  
  selectPage(pageKey) {
    if (!this.meetingData?.pages[pageKey]) {
      console.error('找不到頁面:', pageKey);
      return;
    }
    
    this.currentPageKey = pageKey;
    const page = this.meetingData.pages[pageKey];
    
    
    // 更新導航激活狀態
    document.querySelectorAll('.nav-number').forEach(item => {
      item.classList.toggle('active', item.dataset.pageKey === pageKey);
    });
    
    // 渲染頁面
    this.renderPage(page);
    
    // 显示提示
    const pageNum = pageKey.replace('page', '');
    this.showToast(`第 ${pageNum} 頁：${page.title}`);
  }
  
  renderPage(page) {
    const main = document.getElementById('main');
    const container = document.getElementById('main-content');
    
    container.innerHTML = '';
    
    // 設置背景
    if (page.background) {
      main.style.backgroundImage = `url('assets/images/${page.background}')`;
    } else {
      main.style.backgroundImage = 'none';
    }
    
    // 添加標題
    if (page.title) {
      const titleEl = document.createElement('h1');
      titleEl.className = 'page-title';
      titleEl.textContent = page.title;
      container.appendChild(titleEl);
    }
    
    // 添加內容
    if (page.sections && page.sections.length > 0) {
      page.sections.forEach(section => {
        const wrapper = document.createElement('div');
        wrapper.className = 'section';
        
        const contentEl = document.createElement('div');
        contentEl.innerHTML = section.content || '';
        
        // 應用樣式
        if (section.style) {
          Object.assign(contentEl.style, section.style);
        }
        
        wrapper.appendChild(contentEl);
        container.appendChild(wrapper);
      });
    }
  }
  
  setupEventListeners() {
    // 齒輪按鈕
    document.getElementById('gear-btn').addEventListener('click', () => {
      const editor = document.getElementById('editor-panel');
      editor.classList.toggle('open');
    });
  }
  
  setupEditorCommunication() {
    window.addEventListener('message', (e) => {
      console.log('收到消息:', e.data);
      
      if (e.data?.type === 'preview-page') {
        // 預覽編輯器中的頁面
        this.meetingData.pages[e.data.pageKey] = e.data.pageData;
        this.selectPage(e.data.pageKey);
        this.showToast('預覽模式');
      }
      
      if (e.data?.type === 'close-editor') {
        document.getElementById('editor-panel').classList.remove('open');
        this.showToast('編輯器已關閉');
      }
    });
  }
  
  showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1600);
  }
  
  createSampleData() {
    this.meetingData = {
      pages: {
        page01: {
          title: "歡迎頁面",
          background: "slide1.jpg",
          sections: [
            {
              type: "text",
              content: "歡迎使用聚會流程系統"
            }
          ]
        }
      }
    };
  }
}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
  window.meetingApp = new MeetingApp();
  console.log('✅ 應用初始化完成');
});