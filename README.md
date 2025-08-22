# 🚇 通勤打卡自动记录 (Dify + Google Sheets)

<details open>
<summary>🇨🇳 中文说明 (Chinese)</summary>

## 📌 简介
本项目实现了一个**通勤打卡自动化工作流**：  
你只需要输入 **“今天 8:30 出门”** 或 **“19:05 到家 路上堵车”**，系统会自动解析日期/时间/事件类型/通勤方式，并写入 Google Sheets。  

- 使用 [Dify](https://dify.ai/) 作为 LLM 工作流平台  
- 使用 Google Apps Script 提供 Webhook 写入 Google Sheets  
- 使用 JSON Schema + Prompt 强约束，保证所有时间戳都是 **北京时间 (UTC+8)**  

---

## 🏗️ 架构
```
用户输入 → Dify LLM (解析语义) → JSON Schema → HTTP 请求 → Google Apps Script → Google Sheets
```

---

## ⚙️ 部署步骤

### 1. Google Sheets
1. 新建一个表格，底部标签命名为 `trans`  
2. 设置表头（第 1 行）：

| 日期 | 通勤方式（上班） | 出门时间 | 到达时间 | 下班打卡 | 到家 | 通勤方式（下班） | 备注 |
| ---- | --------------- | -------- | -------- | -------- | ---- | ---------------- | ---- |

3. 进入 **文件 → 设置 → 时区**，改为 **(GMT+8) 北京时间**。  

---

### 2. Google Apps Script
1. 打开 [Google Apps Script](https://script.google.com/)  
2. 新建脚本，粘贴 [script.js](./script.js)（记得替换 `SPREADSHEET_ID` 为你的表格 ID）  
3. 部署为 **Web 应用**：  
   - 选择“任何人可访问”  
   - 得到 Webhook URL，例如：  
     ```
     https://script.google.com/macros/s/xxxxxxx/exec
     ```

---

### 3. Dify 工作流

#### (1) Python 代码节点
见 [prompt.md](./prompt.md) 中说明。此节点主要返回 **今天日期** 和 **当前北京时间**。  

#### (2) LLM Prompt  
使用 `prompt.md` 提供的完整 Prompt，确保 JSON 输出严格符合 Schema。  

#### (3) JSON Schema
同样在 `prompt.md` 中，强制约束：  
- 时间必须为 `YYYY-MM-DDTHH:mm:ss+08:00`  
- 日期必须为 `YYYY-MM-DD`  

#### (4) HTTP 节点
- Method: `POST`  
- URL: Google Apps Script 部署的地址  
- Headers: `Content-Type: application/json; charset=utf-8`  
- Body 示例：  
```json
{
  "date": "{{#llm.structured_output.date_local#}}",
  "event": "{{#llm.structured_output.event#}}",
  "time": "{{#llm.structured_output.time_local#}}",
  "commute_mode": "{{#llm.structured_output.commute_mode#}}",
  "note": "{{#llm.structured_output.note#}}"
}
```

---

## ✅ 使用示例
输入：  
```
今天 8:30 出门 坐公交
```

写入 Google Sheets：  

| 日期       | 通勤方式（上班） | 出门时间        | 到达时间 | 下班打卡 | 到家 | 通勤方式（下班） | 备注 |
| ---------- | ---------------- | --------------- | -------- | -------- | ---- | ---------------- | ---- |
| 2025-08-22 | 公交             | 2025-08-22 08:30 |          |          |      |                  |      |

</details>

---

<details>
<summary>🇬🇧 English (Click to expand)</summary>

## 📌 Introduction
This project implements an **automated commuting log workflow**.  
You can simply type **“Go out at 8:30 today”** or **“Arrived home at 19:05, traffic jam”**, and the system will parse the event into structured JSON and write it into Google Sheets.  

- [Dify](https://dify.ai/) as the LLM workflow engine  
- Google Apps Script as the webhook writer for Google Sheets  
- JSON Schema + Prompt hard constraints to ensure all timestamps are **Beijing Time (UTC+8)**  

---

## 🏗️ Architecture
```
User input → Dify LLM (semantic parsing) → JSON Schema → HTTP Request → Google Apps Script → Google Sheets
```

---

## ⚙️ Setup

### 1. Google Sheets
1. Create a new spreadsheet, tab named `trans`  
2. Add headers (row 1):  

| Date | Commute Mode (AM) | Depart Home | Arrive Office | Depart Office | Arrive Home | Commute Mode (PM) | Note |
| ---- | ----------------- | ----------- | ------------- | ------------- | ----------- | ----------------- | ---- |

3. Go to **File → Settings → Time zone**, set to **(GMT+8) Beijing Time**.  

---

### 2. Google Apps Script
1. Go to [Google Apps Script](https://script.google.com/)  
2. Create a new project, paste [script.js](./script.js) (replace `SPREADSHEET_ID` with your spreadsheet ID)  
3. Deploy as **Web App**:  
   - Select “Anyone can access”  
   - Get the Webhook URL, e.g.:  
     ```
     https://script.google.com/macros/s/xxxxxxx/exec
     ```

---

### 3. Dify Workflow

#### (1) Python Code Node
See [prompt.md](./prompt.md). This node mainly returns **today’s date** and **current Beijing time**.  

#### (2) LLM Prompt  
Use the full prompt from `prompt.md` to ensure strict JSON Schema output.  

#### (3) JSON Schema
Also in `prompt.md`, enforces constraints:  
- Time must be `YYYY-MM-DDTHH:mm:ss+08:00`  
- Date must be `YYYY-MM-DD`  

#### (4) HTTP Node
- Method: `POST`  
- URL: your deployed Google Script URL  
- Headers: `Content-Type: application/json; charset=utf-8`  
- Body Example:  
```json
{
  "date": "{{#llm.structured_output.date_local#}}",
  "event": "{{#llm.structured_output.event#}}",
  "time": "{{#llm.structured_output.time_local#}}",
  "commute_mode": "{{#llm.structured_output.commute_mode#}}",
  "note": "{{#llm.structured_output.note#}}"
}
```

---

## ✅ Example
Input:  
```
Go out at 8:30 today by bus
```

Written into Google Sheets:  

| Date       | Commute Mode (AM) | Depart Home   | Arrive Office | Depart Office | Arrive Home | Commute Mode (PM) | Note |
| ---------- | ----------------- | ------------- | ------------- | ------------- | ----------- | ----------------- | ---- |
| 2025-08-22 | Bus               | 2025-08-22 08:30 |             |               |             |                   |      |

</details>
