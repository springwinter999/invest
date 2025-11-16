// 投资仓位管理系统 - JavaScript 核心功能

// DOM 元素引用
let totalFundsInput;
let remainingFundsElement;
let allocatedPercentageElement;
let addProjectButton;
let defaultPortfolioButton;
let projectList;
let projectTemplate;
let emptyState;
let errorModal;
let errorMessage;
let errorClose;
let successToast;
let successMessage;
let themeToggle;

// 全局模板验证标志
let templatesLoaded = false;

// 默认仓位配置
const defaultPortfolio = [
    { name: '纳斯达克100', percentage: 45, category: '基金', color: '#165DFF' },
    { name: '标普500', percentage: 20, category: '基金', color: '#00B42A' },
    { name: '中证500', percentage: 15, category: '基金', color: '#FF7D00' },
    { name: '信用债券', percentage: 10, category: '债券', color: '#722ED1' },
    { name: 'MSCI', percentage: 10, category: '基金', color: '#F759AB' }
];

// 图表对象
let pieChart = null;
let barChart = null;

// 项目数据存储
let projects = [];
let projectIdCounter = 0;

// 初始化
function init() {
    // 重新获取DOM元素引用，确保DOM完全加载
    totalFundsInput = document.getElementById('total-funds');
    remainingFundsElement = document.querySelector('#remaining-funds p:last-child');
    allocatedPercentageElement = document.querySelector('#allocated-percentage p:last-child');
    addProjectButton = document.getElementById('add-project');
    defaultPortfolioButton = document.getElementById('default-portfolio');
    projectList = document.getElementById('project-list');
    projectTemplate = document.getElementById('project-template');
    emptyState = document.getElementById('empty-state');
    errorModal = document.getElementById('error-modal');
    errorMessage = document.getElementById('error-message');
    errorClose = document.getElementById('error-close');
    successToast = document.getElementById('success-toast');
    successMessage = document.getElementById('success-message');
    themeToggle = document.getElementById('theme-toggle');
    
    // 验证所有必要的DOM元素是否存在
    validateDOMElements();
    
    // 只有在所有元素验证通过后才绑定事件
    if (templatesLoaded) {
        // 事件监听器
        totalFundsInput.addEventListener('input', handleTotalFundsChange);
        addProjectButton.addEventListener('click', addNewProject);
        defaultPortfolioButton.addEventListener('click', addDefaultPortfolio);
        errorClose.addEventListener('click', hideErrorModal);
        themeToggle.addEventListener('click', toggleTheme);
        
        // 初始化图表
        initCharts();
        
        // 尝试从本地存储加载数据
        loadFromLocalStorage();
    }
}

// 验证DOM元素是否存在
function validateDOMElements() {
    // 重新获取所有DOM元素引用，确保使用最新的DOM状态
    totalFundsInput = document.getElementById('total-funds');
    remainingFundsElement = document.querySelector('#remaining-funds p:last-child');
    allocatedPercentageElement = document.querySelector('#allocated-percentage p:last-child');
    addProjectButton = document.getElementById('add-project');
    defaultPortfolioButton = document.getElementById('default-portfolio');
    projectList = document.getElementById('project-list');
    projectTemplate = document.getElementById('project-template');
    emptyState = document.getElementById('empty-state');
    errorModal = document.getElementById('error-modal');
    errorMessage = document.getElementById('error-message');
    errorClose = document.getElementById('error-close');
    successToast = document.getElementById('success-toast');
    successMessage = document.getElementById('success-message');
    themeToggle = document.getElementById('theme-toggle');
    
    // 验证核心DOM元素
    const requiredElements = [
        { name: 'totalFundsInput', element: totalFundsInput },
        { name: 'projectList', element: projectList },
        { name: 'emptyState', element: emptyState }
    ];
    
    let criticalMissingElements = [];
    
    requiredElements.forEach(({ name, element }) => {
        if (!element) {
            criticalMissingElements.push(name);
        }
    });
    
    // 检查是否可以获取到有效的模板元素（使用getProjectTemplateItem的功能）
    const templateItem = getProjectTemplateItem();
    
    // 定义错误消息
    let errorMsg = '';
    
    // 判断是否有严重错误（核心元素缺失）
    if (criticalMissingElements.length > 0) {
        console.error('缺失必要的核心DOM元素:', criticalMissingElements);
        errorMsg = `系统错误：缺失必要的核心DOM元素 - ${criticalMissingElements.join(', ')}`;
        templatesLoaded = false;
    } 
    // 判断模板元素是否可用
    else if (!templateItem) {
        console.error('无法获取有效的项目模板元素');
        errorMsg = '系统错误：无法获取或创建有效的项目模板元素';
        templatesLoaded = false;
    }
    // 基本验证通过，但需要记录模板状态
    else {
        // 如果直接在DOM中没有找到.project-item元素，但通过后备机制获取到了
        if (!projectTemplate?.querySelector('.project-item')) {
            console.warn('注意：DOM中未找到.project-item元素，但已通过后备机制确保模板可用');
        }
        templatesLoaded = true;
        console.log('所有必要的DOM元素验证通过，模板元素可用');
    }
    
    // 如果有错误消息，显示它
    if (errorMsg) {
        // 延迟显示错误消息，确保错误模态框也已加载
        setTimeout(() => {
            if (errorModal && errorMessage && errorClose) {
                showError(errorMsg);
            } else {
                // 如果错误模态框也没找到，使用console显示错误
                console.error(errorMsg);
                // 同时尝试通过alert显示错误信息
                alert(errorMsg);
            }
        }, 100);
    }
}

// 获取项目模板元素的辅助函数
function getProjectTemplateItem() {
    // 尝试多种方式查找或创建.project-item元素
    let templateItem = null;
    
    // 方法1: 如果projectTemplate存在，尝试在其中查找
    if (projectTemplate) {
        // 直接使用querySelector
        templateItem = projectTemplate.querySelector('.project-item');
        
        // 方法2: 如果方法1失败，尝试获取第一个子元素
        if (!templateItem) {
            templateItem = projectTemplate.firstElementChild;
            if (templateItem) {
                // 如果子元素没有.project-item类，给它添加这个类
                if (!templateItem.classList.contains('project-item')) {
                    templateItem.classList.add('project-item');
                    console.warn('已自动为模板子元素添加project-item类');
                }
            }
        }
        
        // 方法3: 如果前两种方法都失败，尝试使用getElementsByClassName
        if (!templateItem) {
            const items = projectTemplate.getElementsByClassName('project-item');
            if (items.length > 0) {
                templateItem = items[0];
            }
        }
    }
    
    // 方法4: 如果projectTemplate不存在或找不到子元素，创建一个独立的模板元素
    if (!templateItem) {
        console.warn('无法在DOM中找到有效的项目模板，正在创建完整的模板结构');
        
        // 创建模板容器（如果projectTemplate不存在）
        if (!projectTemplate) {
            projectTemplate = document.createElement('div');
            projectTemplate.id = 'project-template';
            projectTemplate.style.display = 'none';
            document.body.appendChild(projectTemplate);
            console.warn('已创建缺失的projectTemplate元素');
        }
        
        // 创建项目项模板
        templateItem = document.createElement('div');
        templateItem.className = 'project-item bg-neutral-50 p-4 rounded-lg border border-neutral-200 relative';
        
        // 填充完整的HTML结构
        templateItem.innerHTML = `
            <button class="delete-project absolute top-3 right-3 text-neutral-400 hover:text-danger p-1 transition-all-300">
                <i class="fa fa-trash-o"></i>
            </button>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                <div class="md:col-span-1">
                    <label class="text-sm text-neutral-500 block mb-1">项目名称</label>
                    <input type="text" class="project-name w-full py-2 px-3 border border-neutral-200 rounded-lg input-focus" placeholder="项目名称">
                </div>
                <div class="md:col-span-1">
                    <label class="text-sm text-neutral-500 block mb-1">投资金额 (¥)</label>
                    <input type="number" class="project-amount w-full py-2 px-3 border border-neutral-200 rounded-lg input-focus" placeholder="0.00" min="0" step="0.01">
                </div>
                <div class="md:col-span-2">
                    <label class="text-sm text-neutral-500 block mb-1"><span class="project-percentage-text">0%</span> 配置</label>
                    <div class="flex items-center gap-3">
                        <input type="range" class="project-percentage flex-1 h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer" min="0" max="100" step="0.1" value="0">
                        <div class="relative">
                            <input type="number" class="project-percentage-input w-20 py-2 px-3 border border-neutral-200 rounded-lg input-focus text-right" placeholder="0.0" min="0" max="100" step="0.1" value="0">
                            <span class="absolute right-3 top-2 text-neutral-500">%</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <div class="flex gap-2">
                    <select class="project-category py-1 px-2 border border-neutral-200 rounded input-focus text-sm">
                        <option value="股票">股票</option>
                        <option value="基金">基金</option>
                        <option value="债券">债券</option>
                        <option value="房地产">房地产</option>
                        <option value="数字货币">数字货币</option>
                        <option value="其他">其他</option>
                    </select>
                    <div class="project-color-picker flex">
                        <button class="w-6 h-6 rounded-full bg-blue-500 border-2 border-white hover:scale-110 transition-all-300 color-option" data-color="#165DFF"></button>
                        <button class="w-6 h-6 rounded-full bg-green-500 border-2 border-white hover:scale-110 transition-all-300 color-option" data-color="#00B42A"></button>
                        <button class="w-6 h-6 rounded-full bg-orange-500 border-2 border-white hover:scale-110 transition-all-300 color-option" data-color="#FF7D00"></button>
                        <button class="w-6 h-6 rounded-full bg-purple-500 border-2 border-white hover:scale-110 transition-all-300 color-option" data-color="#722ED1"></button>
                        <button class="w-6 h-6 rounded-full bg-pink-500 border-2 border-white hover:scale-110 transition-all-300 color-option" data-color="#F759AB"></button>
                    </div>
                </div>
            </div>
        `;
        
        // 将创建的模板项添加到projectTemplate中（如果它存在）
        if (projectTemplate) {
            projectTemplate.appendChild(templateItem);
        }
    }
    
    // 确保返回的模板元素是有效的
    if (templateItem && templateItem.nodeType === 1) { // 1 表示元素节点
        console.log('成功获取有效的项目模板元素');
        return templateItem;
    } else {
        console.error('获取的模板元素无效');
        return null;
    }
}

// 确保DOM完全加载后再执行初始化
document.addEventListener('DOMContentLoaded', () => {
    // 增加延迟时间，确保所有DOM元素都已渲染完成
    setTimeout(() => {
        console.log('开始初始化应用...');
        init();
    }, 300); // 增加到300ms以确保足够的渲染时间
});

// 处理总资金变化
function handleTotalFundsChange() {
    // 验证总资金输入
    const value = totalFundsInput.value;
    if (value && parseFloat(value) <= 0) {
        showError('总资金必须大于0');
        totalFundsInput.classList.add('border-danger');
    } else {
        totalFundsInput.classList.remove('border-danger');
    }
    
    updateProjectAmountsFromPercentages();
    updateSummaryDisplay();
    updateCharts();
    saveToLocalStorage();
}

// 添加新项目
function addNewProject() {
    // 首先验证模板是否已加载
    validateDOMElements(); // 每次操作前都重新验证，确保DOM元素状态最新
    
    if (!templatesLoaded) {
        return; // 验证失败时validateDOMElements已显示错误
    }
    
    // 安全地获取模板元素，使用增强的查找逻辑
    let templateItem = getProjectTemplateItem();
    if (!templateItem) {
        showError('系统错误：无法获取项目模板元素');
        return;
    }
    
    const totalFunds = parseFloat(totalFundsInput?.value) || 0;
    
    // 验证总资金
    if (totalFunds <= 0) {
        showError('请先输入有效的总资金金额');
        return;
    }
    
    // 克隆模板
    const projectItem = templateItem.cloneNode(true);
    const projectId = `project-${projectIdCounter++}`;
    projectItem.dataset.id = projectId;
    
    // 初始化项目颜色
    const colorOptions = projectItem.querySelectorAll('.color-option');
    const randomColor = colorOptions[Math.floor(Math.random() * colorOptions.length)];
    selectColor(randomColor, projectItem);
    
    // 添加事件监听器
    const deleteButton = projectItem.querySelector('.delete-project');
    deleteButton.addEventListener('click', () => deleteProject(projectId));
    
    const nameInput = projectItem.querySelector('.project-name');
    nameInput.addEventListener('input', () => updateProjectData(projectId));
    
    const amountInput = projectItem.querySelector('.project-amount');
    amountInput.addEventListener('input', () => {
        // 验证金额输入
        const value = amountInput.value;
        if (value && parseFloat(value) < 0) {
            amountInput.classList.add('border-danger');
            showError('金额不能为负数');
            return;
        } else {
            amountInput.classList.remove('border-danger');
        }
        
        const percentage = calculatePercentageFromAmount(amountInput.value, totalFunds);
        updatePercentageInput(projectItem, percentage);
        updateProjectData(projectId);
    });
    
    const percentageSlider = projectItem.querySelector('.project-percentage');
    const percentageNumberInput = projectItem.querySelector('.project-percentage-input');
    
    // 滑块事件监听
    percentageSlider.addEventListener('input', handlePercentageChange);
    percentageSlider.addEventListener('change', handlePercentageChange);
    
    // 百分比数字输入框事件监听
    percentageNumberInput.addEventListener('input', handlePercentageNumberChange);
    percentageNumberInput.addEventListener('change', handlePercentageNumberChange);
    
    // 百分比数字输入框事件处理
    function handlePercentageNumberChange() {
        // 获取输入框的值并转换为数字
        let percentage = parseFloat(percentageNumberInput.value) || 0;
        // 限制在0-100范围内
        percentage = Math.max(0, Math.min(percentage, 100));
        
        // 更新滑块值
        percentageSlider.value = percentage.toFixed(1);
        
        // 更新UI显示
        updatePercentageText(projectItem, percentage);
        
        // 动态获取最新的总资金值
        const currentTotalFunds = parseFloat(totalFundsInput.value) || 0;
        
        // 计算对应的金额
        const amount = calculateAmountFromPercentage(percentage, currentTotalFunds);
        
        // 更新金额输入框
        amountInput.value = formatCurrency(amount);
        
        // 更新项目数据
        updateProjectData(projectId);
    }
    
    function handlePercentageChange() {
        // 获取滑块的当前值并转换为数字
        const percentage = parseFloat(percentageSlider.value) || 0;
        // 动态获取最新的总资金值
        const currentTotalFunds = parseFloat(totalFundsInput.value) || 0;
        
        // 更新UI显示 - 传入数字类型的percentage
        updatePercentageText(projectItem, percentage);
        
        // 更新百分比数字输入框
        percentageNumberInput.value = percentage.toFixed(1);
        
        // 计算对应的金额
        const amount = calculateAmountFromPercentage(percentage, currentTotalFunds);
        
        // 更新金额输入框
        amountInput.value = formatCurrency(amount);
        
        // 更新项目数据
        updateProjectData(projectId);
    }
    
    const categorySelect = projectItem.querySelector('.project-category');
    categorySelect.addEventListener('change', () => updateProjectData(projectId));
    
    // 添加颜色选择事件
    colorOptions.forEach(option => {
        option.addEventListener('click', () => selectColor(option, projectItem));
    });
    
    // 添加到DOM
    emptyState.classList.add('hidden');
    projectList.appendChild(projectItem);
    
    // 添加动画
    projectItem.style.opacity = '0';
    projectItem.style.transform = 'translateY(20px)';
    projectItem.style.transition = 'opacity 300ms ease, transform 300ms ease';
    
    setTimeout(() => {
        projectItem.style.opacity = '1';
        projectItem.style.transform = 'translateY(0)';
    }, 10);
    
    // 聚焦到项目名称输入框
    nameInput.focus();
    
    // 创建项目数据
    projects.push({
        id: projectId,
        name: '',
        amount: 0,
        percentage: 0,
        category: '股票',
        color: randomColor.dataset.color
    });
    
    showSuccess('项目已添加');
    updateSummaryDisplay();
    updateCharts();
    saveToLocalStorage();
}

// 添加默认仓位配置
function addDefaultPortfolio() {
    const totalFunds = parseFloat(totalFundsInput.value) || 0;
    
    // 验证总资金
    if (totalFunds <= 0) {
        showError('请先输入有效的总资金金额');
        return;
    }
    
    // 清除现有项目（如果有）
    const existingProjects = document.querySelectorAll('.project-item');
    existingProjects.forEach(project => project.remove());
    projects = [];
    emptyState.classList.add('hidden');
    
    // 添加默认配置的项目
    defaultPortfolio.forEach((config, index) => {
        setTimeout(() => {
            addPortfolioProject(config, totalFunds);
        }, index * 100);
    });
    
    setTimeout(() => {
        showSuccess('默认仓位配置已添加');
        updateSummaryDisplay();
        updateCharts();
        saveToLocalStorage();
    }, defaultPortfolio.length * 100);
}

// 添加单个默认配置项目
function addPortfolioProject(config, totalFunds) {
    // 首先验证模板是否已加载
    validateDOMElements(); // 每次操作前都重新验证，确保DOM元素状态最新
    
    if (!templatesLoaded) {
        return; // 验证失败时validateDOMElements已显示错误
    }
    
    // 安全地获取模板元素，使用增强的查找逻辑
    let templateItem = getProjectTemplateItem();
    if (!templateItem) {
        showError('系统错误：无法获取项目模板元素');
        return;
    }
    
    // 克隆模板
    const projectItem = templateItem.cloneNode(true);
    const projectId = `project-${projectIdCounter++}`;
    projectItem.dataset.id = projectId;
    
    // 设置项目名称
    const nameInput = projectItem.querySelector('.project-name');
    nameInput.value = config.name;
    
    // 设置类别
    const categorySelect = projectItem.querySelector('.project-category');
    categorySelect.value = config.category;
    
    // 设置颜色
    const colorOptions = projectItem.querySelectorAll('.color-option');
    const targetColor = Array.from(colorOptions).find(opt => opt.dataset.color === config.color) || colorOptions[0];
    selectColor(targetColor, projectItem);
    
    // 设置百分比
    const percentageSlider = projectItem.querySelector('.project-percentage');
    const percentageNumberInput = projectItem.querySelector('.project-percentage-input');
    percentageSlider.value = config.percentage.toFixed(1);
    percentageNumberInput.value = config.percentage.toFixed(1);
    updatePercentageText(projectItem, config.percentage);
    
    // 计算并设置金额
    const amountInput = projectItem.querySelector('.project-amount');
    const amount = calculateAmountFromPercentage(config.percentage, totalFunds);
    amountInput.value = formatCurrency(amount);
    
    // 添加事件监听器
    const deleteButton = projectItem.querySelector('.delete-project');
    deleteButton.addEventListener('click', () => deleteProject(projectId));
    
    nameInput.addEventListener('input', () => updateProjectData(projectId));
    
    amountInput.addEventListener('input', () => {
        // 验证金额输入
        const value = amountInput.value;
        if (value && parseFloat(value) < 0) {
            amountInput.classList.add('border-danger');
            showError('金额不能为负数');
            return;
        } else {
            amountInput.classList.remove('border-danger');
        }
        
        const percentage = calculatePercentageFromAmount(amountInput.value, totalFunds);
        updatePercentageInput(projectItem, percentage);
        updateProjectData(projectId);
    });
    
    // 滑块事件监听
    percentageSlider.addEventListener('input', handlePercentageChange);
    percentageSlider.addEventListener('change', handlePercentageChange);
    
    // 百分比数字输入框事件监听
    percentageNumberInput.addEventListener('input', handlePercentageNumberChange);
    percentageNumberInput.addEventListener('change', handlePercentageNumberChange);
    
    // 百分比数字输入框事件处理
    function handlePercentageNumberChange() {
        // 获取输入框的值并转换为数字
        let percentage = parseFloat(percentageNumberInput.value) || 0;
        // 限制在0-100范围内
        percentage = Math.max(0, Math.min(percentage, 100));
        
        // 更新滑块值
        percentageSlider.value = percentage.toFixed(1);
        
        // 更新UI显示
        updatePercentageText(projectItem, percentage);
        
        // 动态获取最新的总资金值
        const currentTotalFunds = parseFloat(totalFundsInput.value) || 0;
        
        // 计算对应的金额
        const amount = calculateAmountFromPercentage(percentage, currentTotalFunds);
        
        // 更新金额输入框
        amountInput.value = formatCurrency(amount);
        
        // 更新项目数据
        updateProjectData(projectId);
    }
    
    function handlePercentageChange() {
        // 获取滑块的当前值并转换为数字
        const percentage = parseFloat(percentageSlider.value) || 0;
        // 动态获取最新的总资金值
        const currentTotalFunds = parseFloat(totalFundsInput.value) || 0;
        
        // 更新UI显示 - 传入数字类型的percentage
        updatePercentageText(projectItem, percentage);
        
        // 更新百分比数字输入框
        percentageNumberInput.value = percentage.toFixed(1);
        
        // 计算对应的金额
        const amount = calculateAmountFromPercentage(percentage, currentTotalFunds);
        
        // 更新金额输入框
        amountInput.value = formatCurrency(amount);
        
        // 更新项目数据
        updateProjectData(projectId);
    }
    
    categorySelect.addEventListener('change', () => updateProjectData(projectId));
    
    // 添加颜色选择事件
    colorOptions.forEach(option => {
        option.addEventListener('click', () => selectColor(option, projectItem));
    });
    
    // 添加到DOM
    projectList.appendChild(projectItem);
    
    // 添加动画
    projectItem.style.opacity = '0';
    projectItem.style.transform = 'translateY(20px)';
    projectItem.style.transition = 'opacity 300ms ease, transform 300ms ease';
    
    setTimeout(() => {
        projectItem.style.opacity = '1';
        projectItem.style.transform = 'translateY(0)';
    }, 10);
    
    // 创建项目数据
    projects.push({
        id: projectId,
        name: config.name,
        amount: amount,
        percentage: config.percentage,
        category: config.category,
        color: config.color
    });
}

// 删除项目
function deleteProject(projectId) {
    const projectItem = document.querySelector(`.project-item[data-id="${projectId}"]`);
    
    if (projectItem) {
        // 添加删除动画
        projectItem.style.opacity = '0';
        projectItem.style.transform = 'translateY(20px) scale(0.95)';
        
        setTimeout(() => {
            projectItem.remove();
            
            // 更新项目数组
            projects = projects.filter(project => project.id !== projectId);
            
            // 检查是否还有项目
            if (projects.length === 0) {
                emptyState.classList.remove('hidden');
            }
            
            updateSummaryDisplay();
            updateCharts();
            saveToLocalStorage();
        }, 300);
        
        showSuccess('项目已删除');
    }
}

// 选择颜色
function selectColor(option, projectItem) {
    const colorOptions = projectItem.querySelectorAll('.color-option');
    colorOptions.forEach(opt => opt.classList.remove('ring-2', 'ring-primary'));
    option.classList.add('ring-2', 'ring-primary');
    
    // 更新项目颜色数据
    const projectId = projectItem.dataset.id;
    const project = projects.find(p => p.id === projectId);
    if (project) {
        project.color = option.dataset.color;
        updateProjectData(projectId);
    }
}

// 从金额计算百分比
function calculatePercentageFromAmount(amount, totalFunds) {
    if (!totalFunds || totalFunds <= 0) return 0;
    const amountValue = parseFloat(amount) || 0;
    // 防止百分比超过100%
    const percentage = (amountValue / totalFunds) * 100;
    return Math.min(percentage, 100);
}

// 从百分比计算金额
function calculateAmountFromPercentage(percentage, totalFunds) {
    const percentageValue = parseFloat(percentage) || 0;
    // 确保百分比在有效范围内
    const validPercentage = Math.max(0, Math.min(percentageValue, 100));
    return validPercentage / 100 * totalFunds;
}

// 更新百分比输入
function updatePercentageInput(projectItem, percentage) {
    const percentageSlider = projectItem.querySelector('.project-percentage');
    const percentageNumberInput = projectItem.querySelector('.project-percentage-input');
    
    percentageSlider.value = percentage.toFixed(1);
    percentageNumberInput.value = percentage.toFixed(1);
    
    updatePercentageText(projectItem, percentage);
}

// 更新百分比文本
function updatePercentageText(projectItem, percentage) {
    const percentageText = projectItem.querySelector('.project-percentage-text');
    percentageText.textContent = `${percentage.toFixed(1)}%`;
}

// 更新项目数据
function updateProjectData(projectId) {
    const projectItem = document.querySelector(`.project-item[data-id="${projectId}"]`);
    const project = projects.find(p => p.id === projectId);
    const totalFunds = parseFloat(totalFundsInput.value) || 0;
    
    if (projectItem && project) {
        const nameInput = projectItem.querySelector('.project-name');
        const amountInput = projectItem.querySelector('.project-amount');
        const percentageInput = projectItem.querySelector('.project-percentage');
        const categorySelect = projectItem.querySelector('.project-category');
        const selectedColor = projectItem.querySelector('.color-option.ring-2');
        const statusElement = projectItem.querySelector('.project-status');
        
        // 验证项目名称
        const projectName = nameInput.value.trim();
        if (!projectName) {
            nameInput.classList.add('border-warning');
        } else {
            nameInput.classList.remove('border-warning');
        }
        
        // 验证金额不超过总资金
        const amount = parseFloat(amountInput.value) || 0;
        const percentage = parseFloat(percentageInput.value) || 0;
        
        // 计算所有项目的总金额
        const otherProjectsTotal = projects
            .filter(p => p.id !== projectId)
            .reduce((sum, p) => sum + p.amount, 0);
        
        const currentTotal = otherProjectsTotal + amount;
        
        if (totalFunds > 0 && currentTotal > totalFunds) {
            amountInput.classList.add('border-danger');
            // 不阻止用户输入，但给予警告
        } else {
            amountInput.classList.remove('border-danger');
        }
        
        project.name = projectName || '未命名项目';
        project.amount = amount;
        project.percentage = percentage;
        project.category = categorySelect.value;
        project.color = selectedColor?.dataset.color || project.color;
        
        // 状态显示已删除
        
        updateSummaryDisplay();
        updateCharts();
        saveToLocalStorage();
    }
}

// 更新项目金额从百分比
function updateProjectAmountsFromPercentages() {
    const totalFunds = parseFloat(totalFundsInput.value) || 0;
    
    projects.forEach(project => {
        const projectItem = document.querySelector(`.project-item[data-id="${project.id}"]`);
        if (projectItem) {
            const amountInput = projectItem.querySelector('.project-amount');
            const newAmount = calculateAmountFromPercentage(project.percentage, totalFunds);
            amountInput.value = formatCurrency(newAmount);
            project.amount = newAmount;
        }
    });
}

// 更新汇总显示
function updateSummaryDisplay() {
    const totalFunds = parseFloat(totalFundsInput.value) || 0;
    const allocatedAmount = projects.reduce((sum, project) => sum + project.amount, 0);
    const remainingAmount = totalFunds - allocatedAmount;
    const allocatedPercentage = totalFunds > 0 ? (allocatedAmount / totalFunds) * 100 : 0;
    
    // 更新剩余资金显示
    remainingFundsElement.textContent = `¥${formatCurrency(remainingAmount)}`;
    
    if (remainingAmount < 0) {
        remainingFundsElement.className = 'text-lg font-semibold text-danger';
        // 不再显示错误弹框，仅保留红色提示
    } else if (remainingAmount > 0) {
        remainingFundsElement.className = 'text-lg font-semibold text-success';
    } else {
        remainingFundsElement.className = 'text-lg font-semibold text-neutral-600';
    }
    
    // 更新已分配比例显示
    allocatedPercentageElement.textContent = `${allocatedPercentage.toFixed(1)}%`;
    
    // 根据分配比例更新样式
    if (allocatedPercentage > 100) {
        allocatedPercentageElement.className = 'text-lg font-semibold text-danger';
    } else if (allocatedPercentage === 100) {
        allocatedPercentageElement.className = 'text-lg font-semibold text-success';
    } else {
        allocatedPercentageElement.className = 'text-lg font-semibold text-primary';
    }
}

// 格式化货币
function formatCurrency(value) {
    return parseFloat(value)?.toFixed(2) || '0.00';
}

// 显示错误信息
function showError(message) {
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
    errorModal.classList.add('flex');
}

// 隐藏错误信息
function hideErrorModal() {
    errorModal.classList.add('hidden');
    errorModal.classList.remove('flex');
}

// 显示成功提示
function showSuccess(message) {
    successMessage.textContent = message;
    successToast.classList.remove('translate-y-16', 'opacity-0');
    successToast.classList.add('translate-y-0', 'opacity-100');
    
    setTimeout(() => {
        successToast.classList.remove('translate-y-0', 'opacity-100');
        successToast.classList.add('translate-y-16', 'opacity-0');
    }, 3000);
}

// 初始化图表
function initCharts() {
    // 饼图
    const pieCtx = document.getElementById('portfolio-pie-chart').getContext('2d');
    pieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: [],
            datasets: [{
                data: [],
                backgroundColor: [],
                borderColor: '#FFFFFF',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? (value / total * 100).toFixed(1) : '0.0';
                            return `${label}: ¥${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                animateScale: true
            }
        }
    });
    
    // 柱状图
    const barCtx = document.getElementById('portfolio-bar-chart').getContext('2d');
    barChart = new Chart(barCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: '投资金额 (¥)',
                data: [],
                backgroundColor: [],
                borderRadius: 8,
                barPercentage: 0.6,
                categoryPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.y || 0;
                            return `¥${formatCurrency(value)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    },
                    grid: {
                        borderDash: [2, 4],
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

// 更新图表
function updateCharts() {
    const validProjects = projects.filter(project => project.amount > 0);
    
    if (validProjects.length === 0) {
        // 清空图表
        pieChart.data.labels = ['暂无数据'];
        pieChart.data.datasets[0].data = [1];
        pieChart.data.datasets[0].backgroundColor = ['#E5E6EB'];
        
        barChart.data.labels = ['暂无数据'];
        barChart.data.datasets[0].data = [0];
        barChart.data.datasets[0].backgroundColor = ['#E5E6EB'];
    } else {
        // 更新图表数据
        pieChart.data.labels = validProjects.map(p => p.name);
        pieChart.data.datasets[0].data = validProjects.map(p => p.amount);
        pieChart.data.datasets[0].backgroundColor = validProjects.map(p => p.color);
        
        barChart.data.labels = validProjects.map(p => p.name);
        barChart.data.datasets[0].data = validProjects.map(p => p.amount);
        barChart.data.datasets[0].backgroundColor = validProjects.map(p => p.color);
    }
    
    pieChart.update();
    barChart.update();
}

// 切换主题
function toggleTheme() {
    const icon = themeToggle.querySelector('i');
    
    if (icon.classList.contains('fa-moon-o')) {
        // 切换到暗色主题
        document.documentElement.classList.add('dark');
        icon.classList.remove('fa-moon-o');
        icon.classList.add('fa-sun-o');
    } else {
        // 切换到亮色主题
        document.documentElement.classList.remove('dark');
        icon.classList.remove('fa-sun-o');
        icon.classList.add('fa-moon-o');
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    try {
        const data = {
            totalFunds: totalFundsInput.value,
            projects: projects,
            projectIdCounter: projectIdCounter
        };
        localStorage.setItem('investment-portfolio-data', JSON.stringify(data));
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 从本地存储加载
function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('investment-portfolio-data');
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // 恢复总资金
            if (data.totalFunds) {
                totalFundsInput.value = data.totalFunds;
            }
            
            // 恢复项目ID计数器
            if (data.projectIdCounter) {
                projectIdCounter = data.projectIdCounter;
            }
            
            // 恢复项目
            if (data.projects && data.projects.length > 0) {
                data.projects.forEach(projectData => {
                    addNewProject();
                    const projectItem = document.querySelector(`.project-item[data-id="${projectData.id}"]`);
                    
                    if (projectItem) {
                        const nameInput = projectItem.querySelector('.project-name');
                        const amountInput = projectItem.querySelector('.project-amount');
                        const percentageInput = projectItem.querySelector('.project-percentage');
                        const categorySelect = projectItem.querySelector('.project-category');
                        
                        nameInput.value = projectData.name || '';
                        amountInput.value = projectData.amount || 0;
                        percentageInput.value = projectData.percentage || 0;
                        categorySelect.value = projectData.category || '股票';
                        
                        // 恢复颜色选择
                        const colorOptions = projectItem.querySelectorAll('.color-option');
                        const colorOption = Array.from(colorOptions).find(opt => opt.dataset.color === projectData.color);
                        if (colorOption) {
                            selectColor(colorOption, projectItem);
                        }
                        
                        updatePercentageText(projectItem, projectData.percentage || 0);
                        updateProjectData(projectData.id);
                    }
                });
                
                // 隐藏空状态
                emptyState.classList.add('hidden');
            }
            
            updateSummaryDisplay();
            updateCharts();
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 监听键盘事件
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + N 添加新项目
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            addNewProject();
        }
        
        // ESC 关闭错误模态框
        if (e.key === 'Escape') {
            hideErrorModal();
        }
    });
}

// 页面加载完成后执行初始化和键盘快捷键设置
window.addEventListener('DOMContentLoaded', () => {
    // 注意：init函数已经在DOMContentLoaded事件中自动调用
    // 这里只需要设置键盘快捷键
    setupKeyboardShortcuts();
    
    // 添加页面加载动画
    document.body.classList.add('loaded');
});

// 暴露一些函数供调试使用
window.InvestmentApp = {
    addNewProject,
    updateSummaryDisplay,
    saveToLocalStorage,
    loadFromLocalStorage
};