# dify_auto_commuting

[English](#english) | [中文](#中文)

---

## 中文

一个基于 [Dify](https://dify.ai/) 平台的自动化通勤辅助项目。  
通过 Dify 提供的工作流功能，你可以快速构建并运行日常通勤相关的自动化流程。

### 功能特性

- **自动化工作流**：利用 Dify 工作流引擎，实现通勤场景下的自动化操作。  
- **可扩展性**：可以根据需求修改或扩展 DSL 文件，定制自己的逻辑。  
- **一键导入**：直接将 DSL 文件导入到 Dify 控制台即可使用。

### 使用方法

1. 克隆本仓库：
   ```bash
   git clone git@github.com:yyb9807/dify_auto_commuting.git
   cd dify_auto_commuting
   ```

2. 打开 [Dify 控制台](https://dify.ai/) → **工作流**  
3. 点击 **导入 DSL 文件**，选择仓库中的 [`workflow.dsl.json`](./workflow.dsl.json)  
4. 成功导入后，即可在 Dify 平台中运行和测试

### DSL 文件说明

本仓库包含一个从 Dify 导出的 **DSL 文件**：  

- 文件名：[`workflow.dsl.json`](./workflow.dsl.json)  
- 作用：描述本项目的工作流逻辑（节点配置、输入输出、数据流转等）。  

#### DSL 内容示例

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "input",
      "type": "Input",
      "properties": {
        "placeholder": "请输入通勤信息"
      }
    },
    {
      "id": "output",
      "type": "Output",
      "properties": {}
    }
  ]
}
```

---

## English

An automation commuting assistant project based on the [Dify](https://dify.ai/) platform.  
With the workflow feature provided by Dify, you can quickly build and run automation processes for daily commuting.

### Features

- **Automated Workflow**: Use the Dify workflow engine to automate commuting tasks.  
- **Extensible**: You can modify or extend the DSL file to customize your own logic.  
- **One-click Import**: Import the DSL file into the Dify console for direct use.

### Usage

1. Clone this repository:
   ```bash
   git clone git@github.com:yyb9807/dify_auto_commuting.git
   cd dify_auto_commuting
   ```

2. Open [Dify Console](https://dify.ai/) → **Workflow**  
3. Click **Import DSL File**, select [`workflow.dsl.json`](./workflow.dsl.json)  
4. After importing successfully, you can run and test it in the Dify platform

### DSL File Description

This repository contains a **DSL file** exported from Dify:  

- Filename: [`workflow.dsl.json`](./workflow.dsl.json)  
- Purpose: Describes the workflow logic of this project (node configuration, inputs, outputs, and data flow).  

#### Example DSL Content

```json
{
  "version": "1.0",
  "nodes": [
    {
      "id": "input",
      "type": "Input",
      "properties": {
        "placeholder": "Enter commuting info"
      }
    },
    {
      "id": "output",
      "type": "Output",
      "properties": {}
    }
  ]
}
```

---

## License

This project is licensed under the [MIT License](./LICENSE).
