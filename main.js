/*
 * Time Segments v0.1.0
 * 
 */
'use strict';

var obsidian = require('obsidian');

class TimeSegmentsSettingTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    display() {
        const { containerEl } = this;
        containerEl.empty();
        // 创建主标题
        containerEl.createEl("h1", { text: "Time Segments - 时间段记录设置" });
        containerEl.createEl("p", {
            text: "自动记录和管理您的写作时间段，提供详细的时间轴视图和导出功能。",
            cls: "setting-item-description"
        });
        // 基本设置部分
        containerEl.createEl("h2", { text: "⏱️ 基本设置" });
        new obsidian.Setting(containerEl)
            .setName("启用编辑检测")
            .setDesc("是否自动检测对已有时间段内容的修改并添加新的时间段")
            .addToggle((toggle) => toggle
            .setValue(this.plugin.settings.enableEditDetection)
            .onChange(async (value) => {
            this.plugin.settings.enableEditDetection = value;
            await this.plugin.saveAll();
        }));
        new obsidian.Setting(containerEl)
            .setName("空闲阈值（分钟）")
            .setDesc("超过该分钟数未操作则自动补齐结束时间。建议设置为 3-10 分钟。")
            .addText((t) => t.setPlaceholder("5")
            .setValue(String(this.plugin.settings.idleMinutes))
            .onChange(async (v) => {
            const n = Math.max(1, Math.min(60, Number(v) || 5));
            this.plugin.settings.idleMinutes = n;
            await this.plugin.saveAll();
        }));
        new obsidian.Setting(containerEl)
            .setName("自动保存间隔（秒）")
            .setDesc("定期保存数据的时间间隔，设置为0则关闭自动保存")
            .addText((t) => t.setPlaceholder("30")
            .setValue(String(this.plugin.settings.autoSaveInterval))
            .onChange(async (v) => {
            const n = Math.max(0, Math.min(300, Number(v) || 30));
            this.plugin.settings.autoSaveInterval = n;
            await this.plugin.saveAll();
        }));
        new obsidian.Setting(containerEl)
            .setName("最大历史记录数")
            .setDesc("保存的最大时间段记录数量，超出时自动删除最旧的记录。设置为0表示无限制")
            .addText((t) => t.setPlaceholder("10000")
            .setValue(String(this.plugin.settings.maxHistoryRecords))
            .onChange(async (v) => {
            const n = Math.max(0, Number(v) || 10000);
            this.plugin.settings.maxHistoryRecords = n;
            await this.plugin.saveAll();
        }));
        // 时间格式设置部分
        containerEl.createEl("h2", { text: "🕐 时间格式设置" });
        new obsidian.Setting(containerEl)
            .setName("时间格式")
            .setDesc("用于开始时间的显示格式。支持：YYYY（年）、MM（月）、DD（日）、HH（时）、mm（分）、ss（秒）")
            .addText((t) => t.setPlaceholder("YYYY/MM/DD HH:mm:ss")
            .setValue(this.plugin.settings.timeFormat)
            .onChange(async (v) => {
            this.plugin.settings.timeFormat = v || "YYYY/MM/DD HH:mm:ss";
            await this.plugin.saveAll();
        }));
        // 添加时间格式预览
        const previewContainer = containerEl.createDiv({ cls: "setting-item" });
        const previewDesc = previewContainer.createDiv({ cls: "setting-item-info" });
        previewDesc.createDiv({ cls: "setting-item-name", text: "预览效果" });
        const previewValue = previewDesc.createDiv({ cls: "setting-item-description" });
        const updatePreview = () => {
            const now = new Date();
            const preview = this.plugin.settings.timeFormat
                .replace("YYYY", String(now.getFullYear()))
                .replace("MM", String(now.getMonth() + 1).padStart(2, '0'))
                .replace("DD", String(now.getDate()).padStart(2, '0'))
                .replace("HH", String(now.getHours()).padStart(2, '0'))
                .replace("mm", String(now.getMinutes()).padStart(2, '0'));
            previewValue.setText(`${this.plugin.settings.prefix}${preview}`);
        };
        updatePreview();
        new obsidian.Setting(containerEl)
            .setName("标记行前缀")
            .setDesc("时间段标记行的前缀，通常使用 '> ' 来创建引用块样式")
            .addText((t) => t.setPlaceholder("> ")
            .setValue(this.plugin.settings.prefix)
            .onChange(async (v) => {
            this.plugin.settings.prefix = v || "> ";
            await this.plugin.saveAll();
            updatePreview();
        }));
        new obsidian.Setting(containerEl)
            .setName("时间段连接符")
            .setDesc("开始时间和结束时间之间的连接符号")
            .addText((t) => t.setPlaceholder("–")
            .setValue(this.plugin.settings.dashBetween)
            .onChange(async (v) => {
            this.plugin.settings.dashBetween = v || "–";
            await this.plugin.saveAll();
        }));
        new obsidian.Setting(containerEl)
            .setName("时间段分隔符")
            .setDesc("当同一行有多个时间段时，它们之间的分隔符")
            .addText((t) => t.setPlaceholder(", ")
            .setValue(this.plugin.settings.rangeJoiner)
            .setValue(this.plugin.settings.rangeJoiner)
            .onChange(async (v) => {
            this.plugin.settings.rangeJoiner = v || ", ";
            await this.plugin.saveAll();
        }));
        // 交互设置部分
        containerEl.createEl("h2", { text: "🎯 交互设置" });
        new obsidian.Setting(containerEl)
            .setName("高亮时长（毫秒）")
            .setDesc("点击时间轴项目后，目标位置高亮显示的持续时间")
            .addText((t) => t.setPlaceholder("1500")
            .setValue(String(this.plugin.settings.highlightDurationMs))
            .onChange(async (v) => {
            const n = Math.max(200, Math.min(5000, Number(v) || 1500));
            this.plugin.settings.highlightDurationMs = n;
            await this.plugin.saveAll();
        }));
        // 时间轴视图设置部分
        containerEl.createEl("h2", { text: "📊 时间轴视图设置" });
        new obsidian.Setting(containerEl)
            .setName("默认时间粒度")
            .setDesc("打开时间轴视图时的默认显示粒度")
            .addDropdown((d) => {
            d.addOptions({
                day: "天",
                week: "周",
                month: "月",
                year: "年"
            })
                .setValue(this.plugin.settings.viewGranularity)
                .onChange(async (v) => {
                // @ts-expect-error
                this.plugin.settings.viewGranularity = v;
                await this.plugin.saveAll();
            });
        });
        new obsidian.Setting(containerEl)
            .setName("默认时间跨度")
            .setDesc("时间轴视图默认显示的时间跨度数量（如最近 N 天/周/月/年）")
            .addText((t) => t.setPlaceholder("1")
            .setValue(String(this.plugin.settings.viewRangeCount))
            .onChange(async (v) => {
            const n = Math.max(1, Math.min(100, Number(v) || 1));
            this.plugin.settings.viewRangeCount = n;
            await this.plugin.saveAll();
        }));
        // 导出设置部分
        containerEl.createEl("h2", { text: "📤 导出设置" });
        new obsidian.Setting(containerEl)
            .setName("导出文件夹")
            .setDesc("导出文件的保存位置，相对于库根目录的路径。留空则导出到根目录")
            .addText((t) => t.setPlaceholder("exports/time-segments")
            .setValue(this.plugin.settings.exportFolder)
            .onChange(async (v) => {
            this.plugin.settings.exportFolder = v || "";
            await this.plugin.saveAll();
        }));
        // 数据管理部分
        containerEl.createEl("h2", { text: "🗂️ 数据管理" });
        // 显示当前统计信息
        const statsContainer = containerEl.createDiv({ cls: "setting-item" });
        const statsInfo = statsContainer.createDiv({ cls: "setting-item-info" });
        statsInfo.createDiv({ cls: "setting-item-name", text: "当前数据统计" });
        const statsDesc = statsInfo.createDiv({ cls: "setting-item-description" });
        const totalSegments = this.plugin.history.length;
        const totalFiles = new Set(this.plugin.history.map(s => s.filePath)).size;
        const totalTime = this.plugin.history.reduce((sum, s) => sum + (s.endAt - s.startAt), 0);
        const totalHours = Math.floor(totalTime / (1000 * 60 * 60));
        const totalMinutes = Math.floor((totalTime % (1000 * 60 * 60)) / (1000 * 60));
        statsDesc.setText(`已记录 ${totalSegments} 个时间段，涉及 ${totalFiles} 个文件，总时长 ${totalHours} 小时 ${totalMinutes} 分钟`);
        // 清空历史数据按钮
        new obsidian.Setting(containerEl)
            .setName("清空历史数据")
            .setDesc("⚠️ 警告：此操作将永久删除所有时间段记录，无法撤销！")
            .addButton((button) => {
            button
                .setButtonText("清空所有数据")
                .setWarning()
                .onClick(async () => {
                const confirmed = window.confirm("确定要清空所有时间段记录吗？\n\n此操作无法撤销，建议先导出数据进行备份。");
                if (confirmed) {
                    this.plugin.history = [];
                    await this.plugin.saveAll();
                    this.display(); // 重新渲染设置页面
                }
            });
        });
        // 使用说明部分
        containerEl.createEl("h2", { text: "📖 使用说明" });
        const instructionsContainer = containerEl.createDiv({ cls: "setting-item" });
        const instructionsInfo = instructionsContainer.createDiv({ cls: "setting-item-info" });
        instructionsInfo.createDiv({ cls: "setting-item-name", text: "快速上手" });
        const instructionsDesc = instructionsInfo.createDiv({ cls: "setting-item-description" });
        instructionsDesc.innerHTML = `
      <ol>
        <li><strong>自动插入时间戳：</strong>直接开始输入内容，插件会自动检测并插入时间戳</li>
        <li><strong>手动插入时间戳：</strong>使用命令面板搜索"插入时间戳"或设置快捷键</li>
        <li><strong>手动结束时间段：</strong>使用命令面板搜索"结束当前时间段"</li>
        <li><strong>自动结束：</strong>停止编辑超过设定时间后自动添加结束时间</li>
        <li><strong>继续编辑：</strong>在已有时间段内容附近编辑会自动添加新的时间段</li>
        <li><strong>查看记录：</strong>使用命令面板打开"时间轴视图"或点击侧边栏图标</li>
        <li><strong>导出数据：</strong>在时间轴视图中可以导出为 Markdown 或 CSV 格式（包含内容）</li>
      </ol>
    `;
        // 添加快捷键信息
        const shortcutsContainer = containerEl.createDiv({ cls: "setting-item" });
        const shortcutsInfo = shortcutsContainer.createDiv({ cls: "setting-item-info" });
        shortcutsInfo.createDiv({ cls: "setting-item-name", text: "快捷键" });
        const shortcutsDesc = shortcutsInfo.createDiv({ cls: "setting-item-description" });
        shortcutsDesc.innerHTML = `
      <ul>
        <li><kbd>Ctrl/Cmd + P</kbd> → "Time Segments: 插入时间戳"</li>
        <li><kbd>Ctrl/Cmd + P</kbd> → "Time Segments: 结束当前时间段"</li>
        <li><kbd>Ctrl/Cmd + P</kbd> → "Time Segments: 打开时间轴视图"</li>
        <li><kbd>Ctrl/Cmd + P</kbd> → "Time Segments: 导出时间段（Markdown）"</li>
        <li><kbd>Ctrl/Cmd + P</kbd> → "Time Segments: 导出时间段（CSV）"</li>
      </ul>
    `;
    }
}

const pad = (n) => (n < 10 ? "0" + n : "" + n);
function formatByPattern(d, pattern) {
    // 支持 YYYY/MM/DD HH:mm:ss
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return pattern
        .replace("YYYY", String(yyyy))
        .replace("MM", mm)
        .replace("DD", dd)
        .replace("HH", hh)
        .replace("mm", mi)
        .replace("ss", ss);
}
function formatDate(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function rangeStart(granularity, count, end = new Date()) {
    const d = new Date(end.getTime());
    switch (granularity) {
        case "day":
            d.setDate(d.getDate() - (count - 1));
            d.setHours(0, 0, 0, 0);
            return d;
        case "week": {
            // 以周一为一周起点
            const day = (d.getDay() + 6) % 7; // 周一=0
            d.setDate(d.getDate() - day - 7 * (count - 1));
            d.setHours(0, 0, 0, 0);
            return d;
        }
        case "month":
            d.setMonth(d.getMonth() - (count - 1), 1);
            d.setHours(0, 0, 0, 0);
            return d;
        case "year":
            d.setFullYear(d.getFullYear() - (count - 1), 0, 1);
            d.setHours(0, 0, 0, 0);
            return d;
    }
}
function isInRange(granularity, count, ts, end = new Date()) {
    const start = rangeStart(granularity, count, end);
    return ts >= start.getTime() && ts <= end.getTime();
}

const VIEW_TYPE_TIME_SEGMENTS = "time-segments-view";
class TimeSegmentsView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.searchTerm = "";
        this.plugin = plugin;
        this.granularity = plugin.settings.viewGranularity;
        this.count = plugin.settings.viewRangeCount;
        this.selectedSegments = new Set(); // 选中的时间段（使用唯一标识）
    }
    getViewType() { return VIEW_TYPE_TIME_SEGMENTS; }
    getDisplayText() { return "时间段时间轴"; }
    getIcon() { return "clock"; }
    async onOpen() {
        this.render();
    }
    async onClose() { }
    getFilteredSegments() {
        const now = new Date();
        let segments = this.plugin.history
            .filter((s) => isInRange(this.granularity, this.count, s.startAt, now))
            .sort((a, b) => b.startAt - a.startAt); // 最新的在前面
        // 应用搜索过滤
        if (this.searchTerm.trim()) {
            const term = this.searchTerm.toLowerCase();
            segments = segments.filter(s => s.filePath.toLowerCase().includes(term));
        }
        return segments;
    }
    groupSegmentsByDate(segments) {
        const groups = new Map();
        for (const segment of segments) {
            const date = formatDate(new Date(segment.startAt));
            if (!groups.has(date)) {
                groups.set(date, []);
            }
            groups.get(date).push(segment);
        }
        return groups;
    }
    calculateStats(segments) {
        const totalTime = segments.reduce((sum, s) => sum + (s.endAt - s.startAt), 0);
        const sessionCount = segments.length;
        const uniqueFiles = new Set(segments.map(s => s.filePath));
        const fileCount = uniqueFiles.size;
        const averageSession = sessionCount > 0 ? totalTime / sessionCount : 0;
        return { totalTime, sessionCount, fileCount, averageSession };
    }
    formatDuration(ms) {
        const minutes = Math.floor(ms / 60000);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        if (hours > 0) {
            return `${hours}小时${remainingMinutes}分钟`;
        }
        else {
            return `${remainingMinutes}分钟`;
        }
    }
    render() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass("time-segments-view");
        // 创建标题栏
        const header = contentEl.createDiv({ cls: "time-segments-header" });
        header.createEl("h2", { text: "时间段记录", cls: "time-segments-title" });
        // 创建控制面板
        const controls = contentEl.createDiv({ cls: "time-segments-controls" });
        // 时间粒度选择
        const granularityContainer = controls.createDiv({ cls: "control-group" });
        granularityContainer.createEl("label", { text: "显示: " });
        const granSel = granularityContainer.createEl("select");
        [
            ["day", "天"],
            ["week", "周"],
            ["month", "月"],
            ["year", "年"],
        ].forEach(([v, label]) => {
            const opt = document.createElement("option");
            opt.value = v;
            opt.text = label;
            granSel.appendChild(opt);
        });
        granSel.value = this.granularity;
        granSel.onchange = () => {
            this.granularity = granSel.value;
            this.render();
        };
        // 数量输入
        const countContainer = controls.createDiv({ cls: "control-group" });
        countContainer.createEl("label", { text: "最近 " });
        const countInput = countContainer.createEl("input", {
            attr: { type: "number", min: "1", style: "width: 60px;" }
        });
        countInput.value = String(this.count);
        countInput.onchange = () => {
            const n = Math.max(1, Number(countInput.value) || 1);
            this.count = n;
            this.render();
        };
        countContainer.createEl("span", { text: ` 个${this.labelOf(this.granularity)}` });
        // 搜索框
        const searchContainer = controls.createDiv({ cls: "control-group" });
        searchContainer.createEl("label", { text: "搜索: " });
        const searchInput = searchContainer.createEl("input", {
            attr: { type: "text", placeholder: "文件名...", style: "width: 120px;" }
        });
        searchInput.value = this.searchTerm;
        searchInput.oninput = () => {
            this.searchTerm = searchInput.value;
            this.render();
        };
        // 按钮组
        const buttonGroup = controls.createDiv({ cls: "button-group" });
        const refreshBtn = buttonGroup.createEl("button", { text: "刷新", cls: "mod-cta" });
        refreshBtn.onclick = () => this.render();
        
        // 全选/取消全选按钮
        const selectAllBtn = buttonGroup.createEl("button", { 
            text: "全选",
            cls: "select-all-btn"
        });
        selectAllBtn.onclick = () => {
            const segs = this.getFilteredSegments();
            if (this.selectedSegments.size === segs.length && segs.length > 0) {
                this.selectedSegments.clear();
            } else {
                this.selectedSegments.clear();
                segs.forEach(s => this.selectedSegments.add(this.getSegmentId(s)));
            }
            this.updateButtonStates();
            this.updateCheckboxes();
        };
        
        // 删除选中项按钮（只有选中项目时才显示）
        const deleteBtn = buttonGroup.createEl("button", { 
            text: `删除选中 (${this.selectedSegments.size})`, 
            cls: "mod-warning delete-selected-btn"
        });
        deleteBtn.style.display = this.selectedSegments.size > 0 ? "inline-block" : "none";
        deleteBtn.onclick = async () => {
            if (this.selectedSegments.size === 0) return;
            if (this.plugin.isDeletingSegments) return; // 防止重复删除
            
            const confirmed = confirm(`确定删除选中的 ${this.selectedSegments.size} 个时间段吗？此操作无法撤销。`);
            if (confirmed) {
                try {
                    // 禁用按钮防止重复点击
                    deleteBtn.disabled = true;
                    deleteBtn.textContent = "删除中...";
                    
                    await new Promise(resolve => {
                        this.deleteSelectedSegments();
                        this.selectedSegments.clear();
                        resolve();
                    });
                    
                    // 使用 setTimeout 确保删除操作完成后再重新渲染
                    setTimeout(() => {
                        try {
                            this.render();
                        } catch (renderError) {
                            console.error('Render after delete failed:', renderError);
                            // 如果渲染失败，尝试刷新整个视图
                            this.leaf.detach();
                        }
                    }, 200);
                } catch (error) {
                    console.error('Delete operation failed:', error);
                    new obsidian.Notice('删除失败：' + error.message);
                    deleteBtn.disabled = false;
                    deleteBtn.textContent = `删除选中 (${this.selectedSegments.size})`;
                }
            }
        };
        
        const exportMdBtn = buttonGroup.createEl("button", { text: "导出 MD" });
        exportMdBtn.onclick = async () => {
            try {
                await this.plugin.exportCurrent(this.getFilteredSegments(), "md");
            }
            catch (e) {
                new obsidian.Notice("导出失败: " + e);
            }
        };
        const exportCsvBtn = buttonGroup.createEl("button", { text: "导出 CSV" });
        exportCsvBtn.onclick = async () => {
            try {
                await this.plugin.exportCurrent(this.getFilteredSegments(), "csv");
            }
            catch (e) {
                new obsidian.Notice("导出失败: " + e);
            }
        };
        const segs = this.getFilteredSegments();
        // 显示统计信息
        const stats = this.calculateStats(segs);
        const statsContainer = contentEl.createDiv({ cls: "time-segments-stats" });
        statsContainer.createEl("div", {
            text: `总时长: ${this.formatDuration(stats.totalTime)} | 会话: ${stats.sessionCount} 次 | 文件: ${stats.fileCount} 个 | 平均: ${this.formatDuration(stats.averageSession)}`,
            cls: "stats-summary"
        });
        // 显示时间范围
        const rangeStartDt = rangeStart(this.granularity, this.count);
        contentEl.createDiv({
            text: `时间范围: ${rangeStartDt.toLocaleDateString()} - ${new Date().toLocaleDateString()}`,
            cls: "range-info"
        });
        // 创建内容区域
        const contentArea = contentEl.createDiv({ cls: "time-segments-content" });
        if (segs.length === 0) {
            contentArea.createEl("div", {
                text: this.searchTerm.trim() ? "未找到匹配的记录" : "暂无记录",
                cls: "no-records"
            });
            return;
        }
        // 按日期分组显示
        const groupedSegments = this.groupSegmentsByDate(segs);
        const sortedDates = Array.from(groupedSegments.keys()).sort().reverse(); // 最新日期在前
        for (const date of sortedDates) {
            const daySegments = groupedSegments.get(date);
            const dayStats = this.calculateStats(daySegments);
            // 日期标题
            const dayHeader = contentArea.createDiv({ cls: "day-header" });
            const dateObj = new Date(date + 'T00:00:00');
            const isToday = formatDate(new Date()) === date;
            const dayLabel = isToday ? "今天" : this.formatRelativeDate(dateObj);
            dayHeader.createEl("h3", {
                text: `${dayLabel} (${dateObj.toLocaleDateString()})`,
                cls: "day-title"
            });
            dayHeader.createEl("span", {
                text: `${this.formatDuration(dayStats.totalTime)} - ${dayStats.sessionCount} 次会话`,
                cls: "day-stats"
            });
            // 该日期的时间段列表
            const dayList = contentArea.createDiv({ cls: "day-segments" });
            for (const s of daySegments.sort((a, b) => b.startAt - a.startAt)) {
                const item = dayList.createDiv({ cls: "time-segment-item" });
                
                // 添加复选框
                const segmentId = this.getSegmentId(s);
                const checkbox = item.createEl("input", { 
                    type: "checkbox", 
                    cls: "segment-checkbox",
                    attr: { "data-segment-id": segmentId }
                });
                checkbox.checked = this.selectedSegments.has(segmentId);
                checkbox.onchange = (e) => {
                    e.stopPropagation();
                    if (checkbox.checked) {
                        this.selectedSegments.add(segmentId);
                    } else {
                        this.selectedSegments.delete(segmentId);
                    }
                    this.updateButtonStates();
                };
                
                const contentDiv = item.createDiv({ cls: "segment-content" });
                const timeInfo = contentDiv.createDiv({ cls: "time-info" });
                const t1 = new Date(s.startAt);
                const t2 = new Date(s.endAt);
                const duration = s.endAt - s.startAt;
                timeInfo.createEl("span", {
                    text: `${t1.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${t2.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                    cls: "time-range"
                });
                timeInfo.createEl("span", {
                    text: this.formatDuration(duration),
                    cls: "duration"
                });
                const fileInfo = contentDiv.createDiv({ cls: "file-info" });
                const fileName = s.filePath.split('/').pop() || s.filePath;
                const filePath = s.filePath.replace(fileName, '');
                fileInfo.createEl("span", { text: fileName, cls: "file-name" });
                if (filePath) {
                    fileInfo.createEl("span", { text: filePath, cls: "file-path" });
                }
                fileInfo.createEl("span", { text: `行 ${s.headerLine + 1}`, cls: "line-number" });
                
                // 点击内容区域打开文件（避免与复选框冲突）
                contentDiv.onclick = () => this.plugin.openAndHighlight(s);
                contentDiv.style.cursor = "pointer";
            }
        }
    }
    formatRelativeDate(date) {
        const today = new Date();
        const diffTime = today.getTime() - date.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 0)
            return "今天";
        if (diffDays === 1)
            return "昨天";
        if (diffDays === 2)
            return "前天";
        if (diffDays < 7)
            return `${diffDays}天前`;
        if (diffDays < 30)
            return `${Math.floor(diffDays / 7)}周前`;
        if (diffDays < 365)
            return `${Math.floor(diffDays / 30)}月前`;
        return `${Math.floor(diffDays / 365)}年前`;
    }
    labelOf(g) {
        switch (g) {
            case "day": return "天";
            case "week": return "周";
            case "month": return "月";
            case "year": return "年";
        }
    }
    
    getSegmentId(segment) {
        // 创建时间段的唯一标识符
        return `${segment.filePath}-${segment.headerLine}-${segment.startAt}`;
    }
    
    updateButtonStates() {
        // 实时更新按钮状态
        const deleteBtn = this.containerEl.querySelector('.delete-selected-btn');
        const selectAllBtn = this.containerEl.querySelector('.select-all-btn');
        
        if (deleteBtn) {
            deleteBtn.textContent = `删除选中 (${this.selectedSegments.size})`;
            deleteBtn.style.display = this.selectedSegments.size > 0 ? "inline-block" : "none";
        }
        
        if (selectAllBtn) {
            const segs = this.getFilteredSegments();
            if (this.selectedSegments.size === segs.length && segs.length > 0) {
                selectAllBtn.textContent = "取消全选";
            } else {
                selectAllBtn.textContent = "全选";
            }
        }
    }
    
    updateCheckboxes() {
        // 实时更新所有复选框状态
        const checkboxes = this.containerEl.querySelectorAll('.segment-checkbox');
        checkboxes.forEach(checkbox => {
            const segmentId = checkbox.getAttribute('data-segment-id');
            if (segmentId) {
                checkbox.checked = this.selectedSegments.has(segmentId);
            }
        });
    }
    
    deleteSelectedSegments() {
        // 设置删除标志，防止删除期间触发其他操作
        this.plugin.isDeletingSegments = true;
        
        try {
            const selectedIds = Array.from(this.selectedSegments);
            
            // 检查是否删除的时间段中包含当前活动的时间段
        const deletedSegments = this.plugin.history.filter(segment => {
            const segmentId = this.getSegmentId(segment);
            return selectedIds.includes(segmentId);
        });
        
        // 清理受影响文件的运行时状态
        const affectedFiles = new Set();
        deletedSegments.forEach(segment => {
            affectedFiles.add(segment.filePath);
        });
        
        // 为每个受影响的文件清理运行时状态
        affectedFiles.forEach(filePath => {
            const state = this.plugin.runtime.get(filePath);
            if (state) {
                // 检查活动段是否被删除
                if (state.activeSegment) {
                    const activeSegmentId = `${filePath}-${state.activeSegment.headerLine}-${state.activeSegment.tokens[0]?.startAt}`;
                    if (selectedIds.includes(activeSegmentId)) {
                        // 清理活动段状态
                        state.activeSegment = undefined;
                        if (state.idleTimerId) {
                            window.clearTimeout(state.idleTimerId);
                            state.idleTimerId = undefined;
                        }
                        state.lastActivityAt = 0;
                    }
                }
            }
        });
        
        // 从历史记录中删除选中的时间段
        this.plugin.history = this.plugin.history.filter(segment => {
            const segmentId = this.getSegmentId(segment);
            return !selectedIds.includes(segmentId);
        });
        
        // 强制清理可能的内存泄漏和重复计时器
        this.plugin.enforceHistoryLimit();
        
        // 保存更改
        this.plugin.saveAll().catch((error) => {
            console.error('Failed to save after deletion:', error);
        });
        
        new obsidian.Notice(`已删除 ${selectedIds.length} 个时间段`);
        } finally {
            // 清除删除标志
            this.plugin.isDeletingSegments = false;
        }
    }
}

class ExportTypeModal extends obsidian.SuggestModal {
    constructor(app, plugin, segments) {
        super(app);
        this.plugin = plugin;
        this.segments = segments;
        this.setPlaceholder("选择导出格式...");
    }
    getSuggestions(query) {
        const items = [
            { label: "导出为 Markdown", value: "md" },
            { label: "导出为 CSV", value: "csv" },
        ];
        const q = (query || "").toLowerCase();
        return items.filter(i => i.label.toLowerCase().includes(q));
    }
    renderSuggestion(value, el) {
        el.createEl("div", { text: value.label });
    }
    onChooseSuggestion(item) {
        this.plugin.exportCurrent(this.segments, item.value).catch((e) => {
            new obsidian.Notice('导出失败：' + e);
        });
    }
}

function buildCSV(segments) {
    const header = ["file", "headerLine", "tokenIndex", "startAt", "endAt"];
    const rows = [header.join(",")];
    for (const s of segments) {
        rows.push([s.filePath, String(s.headerLine + 1), String(s.tokenIndex), String(s.startAt), String(s.endAt)].join(","));
    }
    return rows.join("\n");
}
async function writeToVault(app, folder, filename, content) {
    const base = folder?.trim() ? folder.trim().replace(/\\+/g, "/").replace(/^\/+|\/+$/g, "") : "";
    const path = base ? `${base}/${filename}` : filename;
    const vault = app.vault;
    // 确保目录存在
    if (base && !(await vault.adapter.exists(base))) {
        await vault.createFolder(base);
    }
    if (await vault.adapter.exists(path)) {
        const file = vault.getAbstractFileByPath(path);
        await vault.modify(file, content);
        return file;
    }
    return vault.create(path, content);
}

const DEFAULT_SETTINGS = {
    idleMinutes: 5,
    timeFormat: "YYYY/MM/DD HH:mm:ss",
    prefix: "> ",
    dashBetween: "–",
    rangeJoiner: ", ", // 英文逗号+空格
    highlightDurationMs: 1500,
    viewGranularity: "day",
    viewRangeCount: 1,
    exportFolder: "",
    autoSaveInterval: 30, // 30秒自动保存一次
    maxHistoryRecords: 10000, // 最多保存10000条记录
    enableEditDetection: true,
};

class TimeSegmentsPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.settings = { ...DEFAULT_SETTINGS };
        // file.path -> runtime state
        this.runtime = new Map();
        this.history = [];
        this.isShuttingDown = false;
        this.shutdownProcessed = false; // 防止重复处理关闭事件
        this.isProcessingInput = false; // 防止递归处理输入
        this.lastProcessedTime = 0; // 防止短时间内重复处理
        this.isDeletingSegments = false; // 防止删除期间触发其他操作
    }
    async onload() {
        await this.loadAll();
        // 设置面板
        this.addSettingTab(new TimeSegmentsSettingTab(this.app, this));
        // 注册编辑器事件监听
        this.registerEvent(this.app.workspace.on('editor-change', (editor, info) => {
            this.handleEditorChange(editor, info);
        }));
        // 监听输入事件来检测内容变化（兼容输入法）
        this.registerDomEvent(document, 'input', (evt) => {
            this.handleInputEvent(evt);
        });
        // 视图注册与命令
        this.registerView(VIEW_TYPE_TIME_SEGMENTS, (leaf) => new TimeSegmentsView(leaf, this));
        this.addCommand({
            id: "open-time-segments-view",
            name: "打开时间轴视图",
            callback: () => this.activateView(),
        });
        // 开始/结束 时间段（单一按钮/命令）
        this.addCommand({
            id: "toggle-time-segment",
            name: "开始/结束 时间段",
            editorCallback: () => {
                this.toggleTimeSegment();
            }
        });
        // 功能区按钮
        const ribbon = this.addRibbonIcon("clock", "开始/结束 时间段", () => {
            this.toggleTimeSegment();
        });
        ribbon.addClass("time-segment-toggle-button");
        // 导出命令（合并：打开选择导出格式的弹窗）
        this.addCommand({
            id: "export-time-segments",
            name: "导出时间段",
            callback: async () => {
                const segs = this.filterBySettings();
                new ExportTypeModal(this.app, this, segs).open();
            }
        });
        // 文件切换监听
        this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
            this.handleActiveFileChange();
        }));
        // 文件打开监听
        this.registerEvent(this.app.workspace.on('file-open', (file) => {
            if (file && file.extension === 'md') {
                this.handleFileOpen(file);
            }
        }));
        // 监听Obsidian的quit事件
        this.registerEvent(this.app.workspace.on('quit', () => {
            this.handleAppQuit();
        }));
        // 监听窗口关闭事件（作为备用）
        this.registerDomEvent(window, 'beforeunload', () => {
            this.handleAppQuit();
        });
        // 监听窗口失去焦点（可能是关闭前的信号）
        this.registerDomEvent(window, 'blur', () => {
            // 延迟检查，如果应用真的要关闭，那么很快就会触发其他事件
            setTimeout(() => {
                if (document.hidden || !document.hasFocus()) ;
            }, 100);
        });
        // 创建状态栏项目
        this.statusBarItem = this.addStatusBarItem();
        this.statusBarItem.setText("");
        // 启动自动保存定时器
        this.startAutoSave();
        // 启动状态更新定时器
        this.startStatusUpdater();
    }
    onunload() {
        this.handleAppQuit();
    }
    handleAppQuit() {
        if (this.shutdownProcessed)
            return;
        this.isShuttingDown = true;
        this.shutdownProcessed = true;
        // 退出时补齐所有未封闭时间段
        this.finishAllActiveSegments();
        // 停止自动保存定时器
        this.stopAutoSave();
        // 停止状态更新定时器
        this.stopStatusUpdater();
        // 立即保存数据
        this.saveAll().catch(() => { });
    }
    handleFileOpen(file) {
        if (this.isShuttingDown)
            return;
        // 当文件打开时，检查是否有未完成的时间段需要恢复
        setTimeout(() => {
            const st = this.ensureState(file.path);
            // 从持久化数据中查找未完成的时间段
            const unfinishedSegment = this.findUnfinishedSegment(file.path);
            if (unfinishedSegment && !st.activeSegment) {
                // 恢复未完成的时间段状态
                st.activeSegment = {
                    headerLine: unfinishedSegment.headerLine,
                    tokens: [{ startAt: unfinishedSegment.startAt }],
                    lastTokenIndex: 0,
                };
                const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                if (md && md.file?.path === file.path) {
                    this.resetIdleTimer(md, file, st);
                }
            }
        }, 100); // 延迟一点确保文件已完全加载
    }
    findUnfinishedSegment(filePath) {
        // 查找该文件最新的未完成时间段
        const fileSegments = this.history
            .filter(s => s.filePath === filePath && s.endAt === 0)
            .sort((a, b) => b.startAt - a.startAt);
        return fileSegments.length > 0 ? fileSegments[0] : null;
    }
    handleInputEvent(evt) {
        if (this.isShuttingDown || this.isProcessingInput || this.isDeletingSegments)
            return;
        // 防抖机制：短时间内不重复处理
        const now = Date.now();
        if (now - this.lastProcessedTime < 100) {
            return;
        }
        if (evt.target instanceof HTMLElement) {
            const isInEditor = evt.target.closest('.cm-editor') !== null;
            if (isInEditor) {
                const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
                const file = md?.file;
                if (md && file) {
                    if (this.isFileRenaming())
                        return;
                    this.lastProcessedTime = now;
                    this.isProcessingInput = true;
                    setTimeout(() => {
                        if (!this.isShuttingDown) {
                            this.checkAutoInsertTimestamp(md, file);
                        }
                        this.isProcessingInput = false;
                    }, 200);
                }
            }
        }
    }
    isFileRenaming() {
        // 检查是否在重命名文件
        const activeElement = document.activeElement;
        return activeElement?.classList.contains('nav-file-title-content') ||
            activeElement?.closest('.nav-file-title') !== null ||
            activeElement?.classList.contains('inline-title') ||
            activeElement?.closest('.inline-title') !== null;
    }
    checkAutoInsertTimestamp(md, file) {
        if (this.isShuttingDown || this.isDeletingSegments)
            return;
        const st = this.ensureState(file.path);
        // 如果已经有活动段，只触摸活动，不插入新时间戳
        if (st.activeSegment) {
            this.touchActivity(md, file);
            return;
        }
        const editor = md.editor;
        const cursor = editor.getCursor();
        const currentLine = editor.getLine(cursor.line) || "";
        // 检查是否在一个没有时间戳的新内容行，且不是空行
        if (currentLine.trim() !== "" && !currentLine.startsWith(this.settings.prefix)) {
            // 检查上方是否有未封闭的时间段
            const nearestHeader = this.findNearestTimeHeader(editor, cursor.line);
            if (nearestHeader === -1) {
                // 没有找到时间戳，自动插入
                this.autoInsertTimestamp(editor, cursor.line);
            }
            else {
                // 检查最近的时间戳是否已封闭
                const headerText = editor.getLine(nearestHeader) || "";
                const hasEndTime = headerText.includes(this.settings.dashBetween);
                if (hasEndTime) {
                    // 已封闭，检查当前编辑位置是否在该时间段的内容范围内
                    const contentEnd = this.findClosedSegmentContentEnd(editor, nearestHeader);
                    
                    if (cursor.line >= contentEnd) {
                        // 在时间段内容范围之外，创建新的时间段
                        this.autoInsertTimestamp(editor, cursor.line);
                    } else {
                        // 在内容范围内不操作，交由handleEditorChange按需追加
                    }
                }
                else {
                    // 未封闭，检查是否可以继续当前时间段
                    const startMatch = headerText.match(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?)/);
                    if (startMatch) {
                        const startTime = new Date(startMatch[1].replace(/\//g, '-')).getTime();
                        st.activeSegment = {
                            headerLine: nearestHeader,
                            tokens: [{ startAt: startTime }],
                            lastTokenIndex: 0,
                        };
                        this.resetIdleTimer(md, file, st);
                    }
                }
            }
        }
    }
    autoInsertTimestamp(editor, currentLine) {
        if (this.isShuttingDown)
            return;
        this.isProcessingInput = true; // 防止递归
        const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        const file = md?.file;
        if (!md || !file) {
            this.isProcessingInput = false;
            return;
        }
        const st = this.ensureState(file.path);
        // 避免重复插入
        if (st.activeSegment) {
            this.isProcessingInput = false;
            return;
        }
        const startTime = Date.now();
        const startText = formatByPattern(new Date(startTime), this.settings.timeFormat);
        // 保存当前光标位置和内容
        const cursor = editor.getCursor();
        editor.getLine(currentLine) || "";
        // 插入时间戳行和空行，然后是原内容
        const timestampLine = `${this.settings.prefix}${startText}\n\n`;
        // 在当前行之前插入时间戳和空行
        editor.replaceRange(timestampLine, { line: currentLine, ch: 0 });
        // 光标移动到原内容位置（现在是currentLine + 2）
        editor.setCursor({ line: currentLine + 2, ch: cursor.ch });
        st.activeSegment = {
            headerLine: currentLine,
            tokens: [{ startAt: startTime }],
            lastTokenIndex: 0,
        };
        // 创建未完成的历史记录
        const unfinishedRecord = {
            filePath: file.path,
            headerLine: currentLine,
            tokenIndex: 0,
            startAt: startTime,
            endAt: 0, // 0 表示未完成
        };
        this.history.push(unfinishedRecord);
        this.resetIdleTimer(md, file, st);
        this.saveAll().catch(() => { });
        // 延迟释放锁，确保编辑器操作完成
        setTimeout(() => {
            this.isProcessingInput = false;
        }, 200);
    }
    handleEditorChange(editor, info) {
        if (this.isShuttingDown || this.isProcessingInput)
            return;
        const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        const file = md?.file;
        if (!md || !file || !this.settings.enableEditDetection)
            return;
        this.touchActivity(md, file);
        const st = this.ensureState(file.path);
        // 检测是否在已存在的时间段标记行附近进行编辑
        if (!st.activeSegment) {
            const cursor = editor.getCursor();
            const currentLine = editor.getLine(cursor.line) || "";
            
            // 检查当前行是否有实际内容且不是时间戳行
            if (currentLine.trim() !== "" && !currentLine.startsWith(this.settings.prefix)) {
                // 寻找前面最近的时间标记行
                const headerLine = this.findNearestTimeHeader(editor, cursor.line);
                if (headerLine === -1) {
                    // 上方没有时间戳，立即插入新的时间戳
                    this.autoInsertTimestamp(editor, cursor.line);
                    return;
                }
                if (headerLine !== -1) {
                    // 检查这个标记是否已经有结束时间
                    const headerText = editor.getLine(headerLine) || "";
                    const hasEndTime = headerText.includes(this.settings.dashBetween);
                    
                    if (hasEndTime) {
                        // 已有结束时间，检查当前编辑位置是否在该时间段的内容范围内
                        const contentEnd = this.findClosedSegmentContentEnd(editor, headerLine);
                        
                        if (cursor.line >= contentEnd) {
                            // 在时间段内容范围之外，创建新的时间段
                            this.autoInsertTimestamp(editor, cursor.line);
                        } else {
                            // 在时间段内容范围内也应在当前输入行上方创建新的时间戳，保证新内容归属新段落
                            this.autoInsertTimestamp(editor, cursor.line);
                            return;
                        }
                    }
                    else {
                        // 没有结束时间，继续当前时间段
                        const startMatch = headerText.match(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?)/);
                        if (startMatch) {
                            const startTime = new Date(startMatch[1].replace(/\//g, '-')).getTime();
                            st.activeSegment = {
                                headerLine,
                                tokens: [{ startAt: startTime }],
                                lastTokenIndex: 0,
                            };
                            this.resetIdleTimer(md, file, st);
                        }
                    }
                }
            }
        }
    }
    startAutoSave() {
        this.stopAutoSave(); // 先停止之前的定时器
        if (this.settings.autoSaveInterval > 0) {
            this.autoSaveTimer = window.setInterval(() => {
                if (!this.isShuttingDown) {
                    this.saveAll().catch(() => { });
                }
            }, this.settings.autoSaveInterval * 1000);
        }
    }
    stopAutoSave() {
        if (this.autoSaveTimer) {
            window.clearInterval(this.autoSaveTimer);
            this.autoSaveTimer = undefined;
        }
    }
    startStatusUpdater() {
        this.stopStatusUpdater();
        this.statusUpdateTimer = window.setInterval(() => {
            if (!this.isShuttingDown) {
                this.updateStatusBar();
            }
        }, 1000); // 每秒更新一次
    }
    stopStatusUpdater() {
        if (this.statusUpdateTimer) {
            window.clearInterval(this.statusUpdateTimer);
            this.statusUpdateTimer = undefined;
        }
    }
    updateStatusBar() {
        if (!this.statusBarItem || this.isShuttingDown)
            return;
        const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        const file = md?.file;
        if (!md || !file) {
            this.statusBarItem.setText("");
            return;
        }
        const st = this.runtime.get(file.path);
        if (st?.activeSegment && st.lastActivityAt > 0) {
            const idleTime = Date.now() - st.lastActivityAt;
            const idleSeconds = Math.floor(idleTime / 1000);
            const idleThreshold = this.settings.idleMinutes * 60;
            const remainingTime = idleThreshold - idleSeconds;
            if (remainingTime > 0) {
                const remainingMinutes = Math.floor(remainingTime / 60);
                const remainingSecs = remainingTime % 60;
                this.statusBarItem.setText(`⏱️ 活动中 (${remainingMinutes}:${remainingSecs.toString().padStart(2, '0')} 后自动结束)`);
            }
            else {
                this.statusBarItem.setText(`⏱️ 即将自动结束...`);
            }
        }
        else {
            this.statusBarItem.setText("");
        }
    }
    finishAllActiveSegments() {
        if (this.isShuttingDown && this.shutdownProcessed) {
            // 已经处理过了，不重复处理
            return;
        }
        const currentTime = Date.now();
        // 处理所有运行时活动段
        for (const [filePath, state] of this.runtime.entries()) {
            if (state.activeSegment) {
                // 尝试找到对应的文件和视图
                const leaves = this.app.workspace.getLeavesOfType("markdown");
                let targetView = null;
                let targetFile = null;
                for (const leaf of leaves) {
                    const view = leaf.view;
                    if (view?.file?.path === filePath) {
                        targetView = view;
                        targetFile = view.file;
                        break;
                    }
                }
                if (targetView && targetFile) {
                    // 如果找到视图，正常结束
                    this.finishActiveTokenDirectly(targetView, targetFile, currentTime);
                }
                else {
                    // 如果找不到视图，直接更新历史记录
                    this.finishSegmentInHistory(filePath, state.activeSegment.headerLine, currentTime);
                }
                // 清理状态
                state.activeSegment = undefined;
            }
            if (state.idleTimerId) {
                window.clearTimeout(state.idleTimerId);
                state.idleTimerId = undefined;
            }
        }
        // 处理所有未完成的历史记录（防止遗漏）
        for (const record of this.history) {
            if (record.endAt === 0) {
                record.endAt = currentTime;
            }
        }
        // 立即保存
        this.saveAll().catch(() => { });
    }
    finishSegmentInHistory(filePath, headerLine, endTime) {
        const unfinishedRecord = this.history.find(r => r.filePath === filePath &&
            r.headerLine === headerLine &&
            r.endAt === 0);
        if (unfinishedRecord) {
            unfinishedRecord.endAt = endTime;
        }
    }
    finishActiveTokenDirectly(md, file, endAtMs) {
        try {
            const st = this.ensureState(file.path);
            if (!st.activeSegment)
                return;
            const seg = st.activeSegment;
            const editor = md.editor;
            const headerLineText = editor.getLine(seg.headerLine) ?? "";
            // 结束端时间格式与开始端保持一致
            const d = new Date(endAtMs);
            const pad = (n) => (n < 10 ? "0" + n : "" + n);
            // 根据设置的时间格式决定是否包含秒
            const includeSeconds = this.settings.timeFormat.includes("ss");
            const endText = includeSeconds 
                ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            editor.replaceRange(this.settings.dashBetween + endText, { line: seg.headerLine, ch: headerLineText.length });
            // 更新历史记录
            const unfinishedRecord = this.history.find(r => r.filePath === file.path &&
                r.headerLine === seg.headerLine &&
                r.endAt === 0);
            if (unfinishedRecord) {
                unfinishedRecord.endAt = endAtMs;
            }
        }
        catch (e) {
            // 如果编辑器操作失败，至少更新历史记录
            const st = this.ensureState(file.path);
            this.finishSegmentInHistory(file.path, st.activeSegment?.headerLine || 0, endAtMs);
        }
    }
    handleActiveFileChange() {
        if (this.isShuttingDown)
            return;
        // 当切换文件时，不自动结束之前文件的时间段
        // 每个文件的计时器独立运行
        const activeView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        if (activeView && activeView.file) {
            // 重新激活当前文件的状态
            const state = this.ensureState(activeView.file.path);
            if (state.activeSegment) {
                this.resetIdleTimer(activeView, activeView.file, state);
            }
        }
        // 更新状态栏
        this.updateStatusBar();
    }
    async activateView() {
        const { workspace } = this.app;
        let leaf = workspace.getLeavesOfType(VIEW_TYPE_TIME_SEGMENTS)[0];
        if (!leaf) {
            const rightLeaf = workspace.getRightLeaf(false);
            if (rightLeaf) {
                leaf = rightLeaf;
                await leaf.setViewState({ type: VIEW_TYPE_TIME_SEGMENTS, active: true });
            }
            else {
                return;
            }
        }
        workspace.revealLeaf(leaf);
    }
    findNearestTimeHeader(editor, fromLine) {
        // 从当前行向上搜索最近的时间标记行（限制搜索范围，跨越章节标题则停止）
        const maxDistance = 200; // 加大搜索范围，但遇到章节边界会提前停止
        const searchLimit = Math.max(0, fromLine - maxDistance);
        for (let i = fromLine - 1; i >= searchLimit; i--) {
            const line = editor.getLine(i) || "";
            // 遇到章节标题或水平分割线，视为不同区域，停止搜索
            if (/^\s*#{1,6}\s+/.test(line) || /^\s*-{3,}\s*$/.test(line)) {
                return -1;
            }
            if (line.startsWith(this.settings.prefix) &&
                line.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?/)) {
                return i;
            }
        }
        return -1;
    }
    ensureState(path) {
        if (!path)
            return { lastActivityAt: 0 }; // 防止空路径
        let st = this.runtime.get(path);
        if (!st) {
            st = { lastActivityAt: 0 };
            this.runtime.set(path, st);
        }
        return st;
    }
    touchActivity(md, file) {
        if (this.isShuttingDown)
            return;
        const st = this.ensureState(file.path);
        st.lastActivityAt = Date.now();
        this.resetIdleTimer(md, file, st);
    }
    resetIdleTimer(md, file, st) {
        if (this.isShuttingDown)
            return;
        const state = st ?? this.ensureState(file.path);
        if (state.idleTimerId)
            window.clearTimeout(state.idleTimerId);
        state.idleTimerId = window.setTimeout(() => {
            // 只有当前文件仍然是活动文件时才结束时间段
            const currentActiveView = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (currentActiveView?.file?.path === file.path && !this.isShuttingDown) {
                this.finishActiveToken(md, file, Date.now());
            }
        }, this.settings.idleMinutes * 60 * 1000);
    }
    finishActiveToken(md, file, endAtMs) {
        const st = this.ensureState(file.path);
        if (!st.activeSegment)
            return;
        const seg = st.activeSegment;
        const editor = md.editor;
        try {
            const headerLineText = editor.getLine(seg.headerLine) ?? "";
            const last = seg.tokens[seg.lastTokenIndex];
            if (last.endAt)
                return; // 已补齐
            last.endAt = endAtMs;
            // 结束端时间格式与开始端保持一致
            const d = new Date(endAtMs);
            const pad = (n) => (n < 10 ? "0" + n : "" + n);
            // 根据设置的时间格式决定是否包含秒
            const includeSeconds = this.settings.timeFormat.includes("ss");
            const endText = includeSeconds 
                ? `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
                : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
            editor.replaceRange(this.settings.dashBetween + endText, { line: seg.headerLine, ch: headerLineText.length });
        }
        catch (e) {
            // 如果编辑器操作失败，仍然更新历史记录
            console.warn('Failed to update editor, but will update history:', e);
        }
        // 更新历史记录中的未完成记录
        const unfinishedRecord = this.history.find(r => r.filePath === file.path &&
            r.headerLine === seg.headerLine &&
            r.endAt === 0);
        if (unfinishedRecord) {
            unfinishedRecord.endAt = endAtMs;
        }
        else {
            // 如果找不到记录，创建新的
            const rec = {
                filePath: file.path,
                headerLine: seg.headerLine,
                tokenIndex: seg.lastTokenIndex,
                startAt: seg.tokens[seg.lastTokenIndex].startAt,
                endAt: endAtMs,
            };
            this.history.push(rec);
        }
        // 检查历史记录数量限制
        this.enforceHistoryLimit();
        // 清空活动段
        st.activeSegment = undefined;
        if (st.idleTimerId) {
            window.clearTimeout(st.idleTimerId);
            st.idleTimerId = undefined;
        }
        // 异步保存
        this.saveAll().catch(() => { });
    }
    async openAndHighlight(s) {
        try {
            const { workspace } = this.app;
            
            // 检查文件是否已经在当前工作区中打开
            const currentFile = workspace.getActiveFile();
            const isSameFile = currentFile && currentFile.path === s.filePath;
            
            if (!isSameFile) {
                // 只有当文件不是当前文件时才打开，并且不在新标签页中打开
                await workspace.openLinkText(s.filePath, "", false);
            }
            
            const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
            if (!md)
                return;
            const editor = md.editor;
            
            // 确保目标行在视图中可见
            editor.scrollIntoView({
                from: { line: s.headerLine, ch: 0 },
                to: { line: s.headerLine + 1, ch: 0 }
            });
            
            // 将光标移动到标记行下一行（内容开始位置）
            const contentLine = s.headerLine + 1;
            // 跳过空行到实际内容
            let actualContentLine = contentLine;
            while (actualContentLine < editor.lineCount() &&
                (editor.getLine(actualContentLine) || "").trim() === "") {
                actualContentLine++;
            }
            
            // 先设置光标到目标位置
            editor.setCursor({ line: actualContentLine, ch: 0 });
            
            // 获取该时间段对应的内容范围，并限制高亮范围
            const contentEnd = this.findContentEnd(editor, s.headerLine);
            
                         // 改进的高亮逻辑：限制高亮行数，避免性能问题
             if (contentEnd > actualContentLine) {
                 const maxHighlightLines = 30; // 进一步减少最大高亮行数
                 const actualContentEnd = Math.min(contentEnd, actualContentLine + maxHighlightLines);
                 
                 // 检查内容是否包含可能导致问题的元素
                 const hasProblematicContent = this.checkForProblematicContent(editor, actualContentLine, actualContentEnd);
                 
                 if (hasProblematicContent) {
                     // 对于包含图片或其他复杂内容的段落，直接使用备用高亮方法
                     console.log('Using fallback highlight for content with images or complex elements');
                     this.fallbackHighlight(editor, actualContentLine, actualContentEnd);
                 } else {
                     try {
                         // 使用更安全的高亮方式
                         editor.setSelection(
                             { line: actualContentLine, ch: 0 }, 
                             { line: actualContentEnd, ch: 0 }
                         );
                         
                         // 短暂高亮后恢复，使用更短的时间避免长时间选中
                         window.setTimeout(() => {
                             try {
                                 editor.setCursor({ line: actualContentLine, ch: 0 });
                             } catch (e) {
                                 // 如果设置光标失败，静默处理
                                 console.warn('Failed to reset cursor after highlight:', e);
                             }
                         }, Math.min(this.settings.highlightDurationMs, 2000)); // 最多高亮2秒
                     } catch (selectionError) {
                          // 如果选择失败，使用备用的视觉高亮方法
                          console.warn('Failed to set selection, using fallback highlight method:', selectionError);
                          this.fallbackHighlight(editor, actualContentLine, actualContentEnd);
                     }
                 }
             }
        }
        catch (e) {
            console.warn('Failed to open and highlight:', e);
            new obsidian.Notice('无法打开文件或定位到指定位置');
        }
    }
    
    checkForProblematicContent(editor, startLine, endLine) {
        try {
            // 检查指定范围内是否包含可能导致高亮问题的内容
            for (let i = startLine; i < endLine && i < editor.lineCount(); i++) {
                const line = editor.getLine(i) || "";
                
                // 检查是否包含图片链接
                if (line.includes('![[') || line.includes('![](')) {
                    return true;
                }
                
                // 检查是否包含嵌入内容
                if (line.includes('```') || line.includes('~~~')) {
                    return true;
                }
                
                // 检查是否包含表格
                if (line.includes('|') && line.split('|').length > 2) {
                    return true;
                }
                
                // 检查是否包含复杂的HTML标签
                if (line.includes('<') && line.includes('>')) {
                    return true;
                }
                
                // 检查是否是很长的行（可能包含复杂格式）
                if (line.length > 500) {
                    return true;
                }
            }
            return false;
        } catch (e) {
            console.warn('Error checking for problematic content:', e);
            return true; // 如果检查失败，假设有问题内容，使用备用方法
        }
    }
    
    fallbackHighlight(editor, startLine, endLine) {
        try {
            // 备用高亮方法：通过添加CSS类来实现视觉高亮
            // 首先确保光标在正确位置
            editor.setCursor({ line: startLine, ch: 0 });
            
            // 使用多种方法尝试高亮
            const editorView = editor.cm;
            let highlightApplied = false;
            
            // 方法1：直接操作编辑器的DOM
            if (editorView && editorView.dom) {
                try {
                    const lineElements = editorView.dom.querySelectorAll('.cm-line');
                    const targetLines = [];
                    
                    // 收集需要高亮的行元素（限制范围避免性能问题）
                    const maxLines = Math.min(8, endLine - startLine); // 最多高亮8行
                    for (let i = 0; i < maxLines && (startLine + i) < lineElements.length; i++) {
                        const lineElement = lineElements[startLine + i];
                        if (lineElement) {
                            targetLines.push(lineElement);
                        }
                    }
                    
                    if (targetLines.length > 0) {
                        // 添加高亮类
                        targetLines.forEach(line => {
                            line.classList.add('ts-highlight');
                        });
                        
                        highlightApplied = true;
                        
                        // 短暂延迟后移除高亮类
                        window.setTimeout(() => {
                            targetLines.forEach(line => {
                                if (line && line.classList) {
                                    line.classList.remove('ts-highlight');
                                }
                            });
                        }, Math.min(this.settings.highlightDurationMs, 2000));
                    }
                } catch (domError) {
                    console.warn('DOM highlight method failed:', domError);
                }
            }
            
            // 方法2：如果DOM方法失败，使用滚动和焦点来提供视觉反馈
            if (!highlightApplied) {
                console.log('Using scroll-based fallback highlight');
                
                // 确保内容可见
                editor.scrollIntoView({
                    from: { line: startLine, ch: 0 },
                    to: { line: Math.min(endLine, startLine + 5), ch: 0 }
                });
                
                // 创建一个临时的视觉提示
                this.showTemporaryNotice(`已定位到第 ${startLine + 1} 行的时间段内容`);
            }
            
        } catch (e) {
            // 如果备用方法也失败了，至少确保光标在正确位置
            console.warn('Fallback highlight method also failed:', e);
            try {
                editor.setCursor({ line: startLine, ch: 0 });
                // 滚动到目标位置
                editor.scrollIntoView({
                    from: { line: startLine, ch: 0 },
                    to: { line: startLine + 1, ch: 0 }
                });
            } catch (cursorError) {
                console.warn('Failed to set cursor position:', cursorError);
            }
        }
    }
    
    showTemporaryNotice(message) {
        try {
            new obsidian.Notice(message, 1500);
        } catch (e) {
            console.warn('Failed to show notice:', e);
        }
    }
    
    findContentEnd(editor, headerLine) {
        const totalLines = editor.lineCount();
        // 从时间戳行的下一行开始搜索
        for (let i = headerLine + 1; i < totalLines; i++) {
            const line = editor.getLine(i) || "";
            // 如果遇到新的时间戳行，则内容结束
            if (line.startsWith(this.settings.prefix) &&
                line.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?/)) {
                return i;
            }
        }
        // 如果没有找到新的时间戳，返回文件末尾
        return totalLines;
    }

    findClosedSegmentContentEnd(editor, headerLine) {
        // 对于已封闭的时间段，更精确地计算内容结束位置
        const headerText = editor.getLine(headerLine) || "";
        const hasEndTime = headerText.includes(this.settings.dashBetween);
        
        if (!hasEndTime) {
            // 如果时间段未封闭，使用原来的逻辑
            return this.findContentEnd(editor, headerLine);
        }
        
        const totalLines = editor.lineCount();
        let lastNonEmptyLine = headerLine; // 默认为时间戳行
        
        // 从时间戳行的下一行开始搜索，直到遇到下一个时间戳或文档末尾
        for (let i = headerLine + 1; i < totalLines; i++) {
            const line = editor.getLine(i) || "";
            // 如果遇到新的时间戳行，则内容结束在它之前
            if (line.startsWith(this.settings.prefix) &&
                line.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?/)) {
                break;
            }
            // 如果遇到Markdown标题或水平分割线，也视为新的章节开始
            if (/^\s*#{1,6}\s+/.test(line) || /^\s*-{3,}\s*$/.test(line)) {
                break;
            }
            // 记录最后一个非空行
            if (line.trim() !== "") {
                lastNonEmptyLine = i;
            }
        }
        // 返回"最后一个非空行的下一行"作为内容结束的排他上界
        return lastNonEmptyLine + 1;
    }
    filterBySettings() {
        const { viewGranularity, viewRangeCount } = this.settings;
        const now = new Date();
        return this.history
            .filter((s) => s.endAt > 0) // 只返回已完成的时间段
            .filter((s) => isInRange(viewGranularity, viewRangeCount, s.startAt, now));
    }
    async exportCurrent(segments, type) {
        try {
            const now = new Date();
            const pad = (n) => (n < 10 ? "0" + n : "" + n);
            const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`;
            const name = type === "md" ? `time-segments-${stamp}.md` : `time-segments-${stamp}.csv`;
            const content = type === "md" ? await this.buildMarkdownWithContent(segments) : buildCSV(segments);
            await writeToVault(this.app, this.settings.exportFolder, name, content);
            new obsidian.Notice(`已导出到 ${this.settings.exportFolder ? this.settings.exportFolder + '/' : ''}${name}`);
        }
        catch (e) {
            console.error('Export failed:', e);
            new obsidian.Notice('导出失败：' + e);
        }
    }
    async buildMarkdownWithContent(segments) {
        const byFile = new Map();
        for (const s of segments) {
            const arr = byFile.get(s.filePath) ?? [];
            arr.push(s);
            byFile.set(s.filePath, arr);
        }
        let md = `# 导出时间段 (${segments.length})\n\n`;
        for (const [filePath, arr] of byFile) {
            md += `## ${filePath}\n\n`;
            for (const s of arr.sort((a, b) => a.startAt - b.startAt)) {
                const startDate = new Date(s.startAt);
                const endDate = new Date(s.endAt);
                md += `### ${startDate.toLocaleString()} – ${endDate.toLocaleString()}\n\n`;
                // 获取对应的内容
                const file = this.app.vault.getAbstractFileByPath(filePath);
                if (file instanceof obsidian.TFile) {
                    try {
                        const content = await this.app.vault.read(file);
                        const lines = content.split('\n');
                        const contentStart = s.headerLine + 1;
                        // 跳过空行到实际内容
                        let actualStart = contentStart;
                        while (actualStart < lines.length && lines[actualStart].trim() === "") {
                            actualStart++;
                        }
                        const contentEnd = this.findContentEndInLines(lines, s.headerLine);
                        if (contentEnd > actualStart) {
                            const segmentContent = lines.slice(actualStart, contentEnd).join('\n').trim();
                            if (segmentContent) {
                                md += segmentContent + '\n\n';
                            }
                            else {
                                md += `_此时间段无内容_\n\n`;
                            }
                        }
                        else {
                            md += `_此时间段无内容_\n\n`;
                        }
                    }
                    catch (e) {
                        md += `_无法读取文件内容: ${e}_\n\n`;
                    }
                }
                else {
                    md += `_文件不存在_\n\n`;
                }
                md += `---\n\n`;
            }
        }
        return md;
    }
    findContentEndInLines(lines, headerLine) {
        // 从时间戳行的下一行开始搜索
        for (let i = headerLine + 1; i < lines.length; i++) {
            const line = lines[i] || "";
            // 如果遇到新的时间戳行，则内容结束
            if (line.startsWith(this.settings.prefix) &&
                line.match(/\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?/)) {
                return i;
            }
        }
        // 如果没有找到新的时间戳，返回文件末尾
        return lines.length;
    }
    enforceHistoryLimit() {
        if (this.settings.maxHistoryRecords > 0 && this.history.length > this.settings.maxHistoryRecords) {
            // 按时间排序，删除最旧的记录
            this.history.sort((a, b) => a.startAt - b.startAt);
            const excessCount = this.history.length - this.settings.maxHistoryRecords;
            this.history.splice(0, excessCount);
        }
    }
    async loadAll() {
        try {
            const raw = (await this.loadData());
            if (raw) {
                this.settings = { ...DEFAULT_SETTINGS, ...(raw.settings || {}) };
                this.history = Array.isArray(raw.history) ? raw.history : [];
                // 清理无效数据
                this.history = this.history.filter(r => r.filePath &&
                    typeof r.startAt === 'number' &&
                    typeof r.endAt === 'number' &&
                    r.startAt > 0);
                // 应用历史记录限制
                this.enforceHistoryLimit();
                // 重启自动保存定时器（如果设置改变了）
                this.startAutoSave();
            }
            else {
                this.settings = { ...DEFAULT_SETTINGS };
                this.history = [];
            }
        }
        catch (e) {
            console.error('Failed to load data:', e);
            this.settings = { ...DEFAULT_SETTINGS };
            this.history = [];
        }
    }
    async saveAll() {
        if (this.isShuttingDown && this.shutdownProcessed)
            return;
        try {
            const data = {
                settings: this.settings,
                history: this.history.filter(r => r.filePath && r.startAt > 0), // 过滤无效数据
                version: "1.3.0"
            };
            await this.saveData(data);
        }
        catch (e) {
            console.error('Failed to save data:', e);
        }
    }
    toggleTimeSegment() {
        const md = this.app.workspace.getActiveViewOfType(obsidian.MarkdownView);
        const file = md?.file;
        if (!md || !file) return;
        const editor = md.editor;
        const st = this.ensureState(file.path);
        const now = Date.now();
        const cursor = editor.getCursor();

        // 优先：基于光标向上找最近的未封闭时间戳，若存在则结束它
        const headerLine = this.findNearestTimeHeader(editor, cursor.line);
        if (headerLine !== -1) {
            const headerText = editor.getLine(headerLine) || "";
            const hasEndTime = headerText.includes(this.settings.dashBetween);
            if (!hasEndTime) {
                this.closeSegmentAtHeader(md, file, headerLine, now);
                return;
            }
        }

        // 其次：如果运行时存在活动段，则结束它
        if (st.activeSegment) {
            this.finishActiveToken(md, file, now);
            return;
        }

        // 再次：如果历史中存在未完成记录（但运行时未恢复），则结束它
        const unfinished = this.findUnfinishedSegment(file.path);
        if (unfinished) {
            this.closeSegmentAtHeader(md, file, unfinished.headerLine, now);
            return;
        }

        // 否则：开始一个新的时间戳
        this.autoInsertTimestamp(editor, cursor.line);
    }

    closeSegmentAtHeader(md, file, headerLine, endAtMs) {
        try {
            const editor = md.editor;
            const headerText = editor.getLine(headerLine) || "";
            if (headerText.includes(this.settings.dashBetween)) {
                // 已有结束时间，不重复添加
                return;
            }
            const d = new Date(endAtMs);
            const pad2 = (n) => (n < 10 ? "0" + n : "" + n);
            // 根据设置的时间格式决定是否包含秒
            const includeSeconds = this.settings.timeFormat.includes("ss");
            const endText = includeSeconds 
                ? `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`
                : `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
            editor.replaceRange(this.settings.dashBetween + endText, { line: headerLine, ch: headerText.length });

            // 同步历史记录
            let rec = this.history.find(r => r.filePath === file.path && r.headerLine === headerLine && r.endAt === 0);
            if (!rec) {
                // 尝试从标题解析开始时间
                const startMatch = headerText.match(/(\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}(?::\d{2})?)/);
                const startAt = startMatch ? new Date(startMatch[1].replace(/\//g, '-')).getTime() : Date.now();
                rec = {
                    filePath: file.path,
                    headerLine: headerLine,
                    tokenIndex: 0,
                    startAt,
                    endAt: 0,
                };
                this.history.push(rec);
            }
            rec.endAt = endAtMs;

            // 清理运行时状态
            const st = this.ensureState(file.path);
            if (st.activeSegment && st.activeSegment.headerLine === headerLine) {
                st.activeSegment = undefined;
            }
            if (st.idleTimerId) {
                window.clearTimeout(st.idleTimerId);
                st.idleTimerId = undefined;
            }
            this.enforceHistoryLimit();
            this.saveAll().catch(() => {});
        } catch (e) {
            console.warn('Failed to close segment at header:', e);
            // 回退仅更新历史
            this.finishSegmentInHistory(file.path, headerLine, endAtMs);
            this.saveAll().catch(() => {});
        }
    }
}

module.exports = TimeSegmentsPlugin;
