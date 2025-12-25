class Editor {
  constructor() {
    this.currentPageKey = null;
    this.meetingData = null;
    this.currentPage = null;
    this.hostList = []; // 主持人列表
    
    this.init();
  }
  
  async init() {
    await this.loadHostList(); // 先加载主持人列表
    this.loadData();
    this.bindEvents();
    this.renderBackgroundOptions();
    this.notifyParent('editor-ready');
  }
  
  async loadHostList() {
    try {
      // 尝试从独立文件加载主持人列表
      const response = await fetch('data/hosts.json');
      if (response.ok) {
        const data = await response.json();
        this.hostList = data.hosts || [];
        console.log('✅ 主持人列表加载成功:', this.hostList);
      } else {
        // 如果文件不存在，使用默认列表
        this.hostList = [
          "Doreen姊妹",
          "Sheri姊妹", 
          "王蕭殷牧師",
          "張弟兄",
          "李姊妹",
          "Daniel區長"
        ];
        console.log('⚠️ 使用默认主持人列表');
      }
    } catch (error) {
      console.log('使用内置主持人列表');
      this.hostList = [
        "Doreen姊妹",
        "Sheri姊妹",
        "王蕭殷牧師",
        "張弟兄", 
        "李姊妹",
        "Daniel區長"
      ];
    }
    
    this.renderHostOptions();
  }
  
  renderHostOptions() {
    const select = document.getElementById('host-select');
    if (!select) return;
    
    // 清空选项（保留第一个）
    select.innerHTML = '<option value="">-- 選擇主持人 --</option>';
    
    // 添加主持人选项
    this.hostList.forEach(host => {
      const option = document.createElement('option');
      option.value = host;
      option.textContent = host;
      select.appendChild(option);
    });
    
    // 添加自定义选项
    const customOption = document.createElement('option');
    customOption.value = "__custom__";
    customOption.textContent = "其他（自定義）";
    select.appendChild(customOption);
  }
  
  renderForm() {
    if (!this.currentPage) return;
    
    document.getElementById('page-title').value = this.currentPage.title || '';
    document.getElementById('page-desc').value = this.currentPage.description || '';
    
    // 如果是第一页，显示主持人信息
    if (this.currentPageKey === 'page01' || this.currentPage.id === 'page01') {
      const hostInfo = this.extractHostInfo(this.currentPage);
      
      // 设置主持人选择
      const hostSelect = document.getElementById('host-select');
      if (hostSelect && hostInfo.name) {
        // 检查是否在列表中
        const isInList = this.hostList.some(h => h === hostInfo.name);
        if (isInList) {
          hostSelect.value = hostInfo.name;
          document.getElementById('custom-host-input').style.display = 'none';
        } else {
          hostSelect.value = '__custom__';
          document.getElementById('custom-host-input').style.display = 'block';
          document.getElementById('custom-host-name').value = hostInfo.name;
        }
      }
      
      // 设置备注
      document.getElementById('host-notes').value = hostInfo.notes || '';
    } else {
      // 非第一页，隐藏主持人部分
      document.getElementById('host-section').style.display = 'none';
    }
  }
  
  extractHostInfo(page) {
    let hostName = '';
    let hostNotes = '';
    
    if (page.sections) {
      page.sections.forEach(section => {
        if (section.content) {
          // 匹配 "主持：XXX" 格式
          const match = section.content.match(/主持[：:]\s*([^\n<]+)/);
          if (match) {
            hostName = match[1].trim();
          }
          
          // 匹配备注信息（可以根据需要扩展）
          if (section.content.includes('備註') || section.content.includes('备注')) {
            hostNotes = section.content;
          }
        }
      });
    }
    
    return { name: hostName, notes: hostNotes };
  }
  
  bindEvents() {
    // 主持人选择事件
    const hostSelect = document.getElementById('host-select');
    if (hostSelect) {
      hostSelect.addEventListener('change', (e) => {
        if (e.target.value === '__custom__') {
          document.getElementById('custom-host-input').style.display = 'block';
          document.getElementById('custom-host-name').focus();
        } else {
          document.getElementById('custom-host-input').style.display = 'none';
        }
      });
    }
    
    // 自定义主持人按钮
    document.getElementById('custom-host-btn').addEventListener('click', () => {
      document.getElementById('host-select').value = '__custom__';
      document.getElementById('custom-host-input').style.display = 'block';
      document.getElementById('custom-host-name').focus();
    });
    
    // 保存和关闭按钮
    document.getElementById('save-btn').addEventListener('click', () => this.saveChanges());
    document.getElementById('close-btn').addEventListener('click', () => this.closeEditor());
    
    // 背景选择
    document.getElementById('background-image').addEventListener('change', (e) => {
      if (this.currentPage) {
        this.currentPage.background = e.target.value;
      }
    });
  }
  
  updateHostInfo() {
    if (!this.currentPage || (this.currentPageKey !== 'page01' && this.currentPage.id !== 'page01')) {
      return;
    }
    
    const hostSelect = document.getElementById('host-select');
    let hostName = '';
    
    if (hostSelect.value === '__custom__') {
      hostName = document.getElementById('custom-host-name').value.trim();
    } else {
      hostName = hostSelect.value;
    }
    
    const hostNotes = document.getElementById('host-notes').value.trim();
    
    if (!hostName) return;
    
    // 更新或添加主持人section
    let hostSectionIndex = -1;
    let notesSectionIndex = -1;
    
    this.currentPage.sections = this.currentPage.sections || [];
    
    // 找到现有的主持人section
    this.currentPage.sections.forEach((section, index) => {
      if (section.content && section.content.includes('主持：')) {
        hostSectionIndex = index;
      }
      if (section.content && (section.content.includes('備註') || section.content.includes('备注'))) {
        notesSectionIndex = index;
      }
    });
    
    // 更新或添加主持人信息
    const hostSection = {
      type: "text",
      content: `主持：${hostName}`,
      style: {
        "fontSize": "60px",
        "textAlign": "center",
        "color": "#f1c40f",
        "textShadow": "0 0 10px rgba(241, 196, 15, 0.5)"
      }
    };
    
    if (hostSectionIndex >= 0) {
      this.currentPage.sections[hostSectionIndex] = hostSection;
    } else {
      // 插入到第二个位置（在欢迎语之后）
      this.currentPage.sections.splice(1, 0, hostSection);
    }
    
    // 更新或添加备注
    if (hostNotes) {
      const notesSection = {
        type: "text",
        content: hostNotes,
        style: {
          "fontSize": "28px",
          "textAlign": "center",
          "color": "#bdc3c7",
          "fontStyle": "italic",
          "marginTop": "20px"
        }
      };
      
      if (notesSectionIndex >= 0) {
        this.currentPage.sections[notesSectionIndex] = notesSection;
      } else {
        this.currentPage.sections.push(notesSection);
      }
    }
    
    // 保存主持人到独立文件（可选）
    this.saveHostToFile(hostName);
  }
  
  async saveHostToFile(hostName) {
    // 如果主持人不在列表中，添加到列表
    if (!this.hostList.includes(hostName)) {
      this.hostList.push(hostName);
      
      // 尝试保存到独立文件
      const hostData = {
        hosts: this.hostList,
        lastUpdated: new Date().toISOString(),
        currentHost: hostName
      };
      
      try {
        // 注意：浏览器环境无法直接写入文件
        // 这里只是更新内存中的列表，实际需要后端支持
        console.log('主持人列表已更新:', this.hostList);
        
        // 更新选择器
        this.renderHostOptions();
      } catch (error) {
        console.error('保存主持人列表失败:', error);
      }
    }
  }
  
  saveChanges() {
    if (!this.currentPage) {
      alert('沒有可保存的頁面數據');
      return;
    }
    
    // 更新基本数据
    this.currentPage.title = document.getElementById('page-title').value;
    this.currentPage.description = document.getElementById('page-desc').value;
    this.currentPage.background = document.getElementById('background-image').value;
    
    // 如果是第一页，更新主持人信息
    if (this.currentPageKey === 'page01' || this.currentPage.id === 'page01') {
      this.updateHostInfo();
    }
    
    // 保存到 localStorage
    localStorage.setItem('meeting-data', JSON.stringify(this.meetingData));
    
    // 通知主頁面
    this.notifyParent('meeting-data-update', this.meetingData);
    
    // 更新顯示
    this.updatePageInfo();
    
    alert('✅ 變更已儲存！');
  }
  
  // ... 其他方法保持不变 ...
}