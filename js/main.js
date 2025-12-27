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
      const saved = localStorage.getItem('meetingData');
      if (saved) {
        this.meetingData = JSON.parse(saved);
        console.log('✅ 从 localStorage 加载数据');
      } else {
        const response = await fetch('data/meeting.json');
        this.meetingData = await response.json();
        console.log('✅ 从 meeting.json 加载默认数据');
      }
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
    
    document.querySelectorAll('.nav-number').forEach(item => {
      item.classList.toggle('active', item.dataset.pageKey === pageKey);
    });
    
    this.renderPage(page);
    
    const pageNum = pageKey.replace('page', '');
    this.showToast(`第 ${pageNum} 頁：${page.title}`);
  }
  
  renderPage(page) {
    const main = document.getElementById('main');
    const container = document.getElementById('main-content');
    
    container.innerHTML = '';
    
    if (page.background) {
      main.style.backgroundImage = `url('assets/images/${page.background}')`;
      main.style.backgroundSize = 'cover';
      main.style.backgroundPosition = 'center';
      main.style.backgroundRepeat = 'no-repeat';
    } else {
      main.style.backgroundImage = 'none';
    }
    
    if (page.title) {
      const titleEl = document.createElement('h1');
      titleEl.className = 'page-title';
      titleEl.textContent = page.title;
      container.appendChild(titleEl);
    }
    
    if (page.sections && page.sections.length > 0) {
      page.sections.forEach(section => {
        const wrapper = document.createElement('div');
        wrapper.className = 'section';
        
        const contentEl = document.createElement('div');
        contentEl.innerHTML = (section.content || '').replace(/\n/g, '<br>');
        
        // 👇 关键：第一页的主持人文字可点击
        if (this.currentPageKey === 'page01' && section.content && section.content.includes('主持：')) {
          contentEl.style.cursor = 'pointer';
          contentEl.title = '點擊修改主持人';
          contentEl.onclick = () => this.editHost();
        }
        
        if (section.style) {
          Object.assign(contentEl.style, section.style);
        }
        
        wrapper.appendChild(contentEl);
        container.appendChild(wrapper);
      });
    }
  }
  
  setupEventListeners() {
    document.getElementById('gear-btn').addEventListener('click', () => {
      const editor = document.getElementById('editor-panel');
      editor.classList.toggle('open');
    });
  }
  
  setupEditorCommunication() {
    window.addEventListener('message', (e) => {
      if (!e.data?.type) return;

      if (e.data.type === 'save-page') {
        this.meetingData.pages[e.data.pageKey] = e.data.pageData;
        try {
          localStorage.setItem('meetingData', JSON.stringify(this.meetingData));
        } catch (err) {
          console.warn('暂存失败:', err);
        }
        if (this.currentPageKey === e.data.pageKey) {
          this.selectPage(e.data.pageKey);
          this.showToast('✅ 頁面已即時更新');
        }
      }

      if (e.data.type === 'preview-page') {
        this.meetingData.pages[e.data.pageKey] = e.data.pageData;
        this.selectPage(e.data.pageKey);
        this.showToast('預覽模式');
      }
      
      if (e.data.type === 'close-editor') {
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

  // 👇 新增：直接在主页面编辑主持人（权宜之计）
  editHost() {
    const currentHostSection = this.meetingData.pages.page01.sections.find(s => 
      s.content && s.content.includes('主持：')
    );
    const currentName = currentHostSection 
      ? currentHostSection.content.replace('主持：', '') 
      : '';

    const newName = prompt('請輸入主持人名字：', currentName);
    if (newName === null) return;

    const hostName = newName.trim();
    if (!hostName) {
      alert('主持人名字不能為空');
      return;
    }

    const hostSection = {
      type: "text",
      content: `主持：${hostName}`,
      style: {
        fontSize: "60px",
        textAlign: "center",
        color: "#f1c40f",
        textShadow: "0 0 10px rgba(241, 196, 15, 0.5)"
      }
    };

    const sections = this.meetingData.pages.page01.sections;
    let found = false;
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].content && sections[i].content.includes('主持：')) {
        sections[i] = hostSection;
        found = true;
        break;
      }
    }
    if (!found && sections) {
      sections.splice(1, 0, hostSection);
    }

    try {
      localStorage.setItem('meetingData', JSON.stringify(this.meetingData));
    } catch (e) {
      console.warn('暂存失败');
    }

    this.selectPage('page01');
    this.showToast(`✅ 主持人已更新為：${hostName}`);
  }

  // 👇 下载完整数据（保留）
  downloadMeetingData() {
    if (!this.meetingData) {
      alert('❌ 無數據可下載');
      return;
    }
    const dataStr = JSON.stringify(this.meetingData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8' });
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'default-meeting.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }
}

// 初始化 + 退出按钮
document.addEventListener('DOMContentLoaded', () => {
  window.meetingApp = new MeetingApp();
  console.log('✅ 應用初始化完成');

  const exitBtn = document.createElement('button');
  exitBtn.textContent = '結束並保存';
  exitBtn.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 100px;
    z-index: 1000;
    padding: 12px 24px;
    background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
  exitBtn.onclick = () => window.meetingApp.downloadMeetingData();
  document.body.appendChild(exitBtn);
});