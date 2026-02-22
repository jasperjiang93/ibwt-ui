# Real MCP Integration Guide

## Overview

IBWT现在集成了真实的MCP工具，使用本地CLI命令执行任务。

## 已安装的工具

### 1. Pandoc - Markdown to PDF转换器
- **命令**: `pandoc input.md --pdf-engine=weasyprint -o output.pdf`
- **用途**: 将Markdown文档转换为PDF报告
- **IBWT中的价格**: 200 $IBWT/call

### 2. gog - Gmail/Calendar/Drive CLI
- **命令**: `gog gmail send --to="user@example.com" --subject="..." --body="..." --attach="file.pdf"`
- **用途**: 通过Gmail发送带附件的邮件
- **IBWT中的价格**: 150 $IBWT/call

### 3. Web Scraper
- **用途**: 网页数据抓取（暂时模拟）
- **IBWT中的价格**: 100 $IBWT/call

## 工作流程

### 1. 创建任务
用户通过对话界面创建任务：
```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000/dashboard/tasks
# 点击 "+ New Task" 按钮
# 与AI对话描述任务需求
```

### 2. Agent接受任务
Agent自动匹配并生成bid，用户接受bid后：
- 任务状态变为 `in_progress`
- 资金通过Solana escrow锁定

### 3. 执行任务
使用agent executor脚本模拟任务执行：

```bash
# 获取任务ID（从dashboard中找到in_progress的任务）
tsx scripts/agent-executor.ts <taskId>
```

执行器会：
1. 读取任务详情和accepted bid的MCP plan
2. 根据plan调用真实的CLI工具：
   - 生成Markdown报告
   - 使用pandoc转换为PDF
   - （可选）使用gog发送邮件
3. 将结果提交到API（状态变为 `pending_review`）

### 4. 审核结果
用户在任务详情页查看结果：
- **Approve**: 释放资金给agent（状态变为 `completed`）
- **Decline**: 退款给用户（状态变为 `cancelled`）

## 示例：完整流程

```bash
# 1. 确保开发服务器运行
pnpm dev

# 2. 重置数据库（可选）
pnpm db:seed

# 3. 在浏览器中创建任务
# http://localhost:3000/dashboard/tasks

# 4. 找到in_progress的任务ID
# 例如: cmlofnd4f0009vudax7y8hq2z

# 5. 执行任务
tsx scripts/agent-executor.ts cmlofnd4f0009vudax7y8hq2z

# 6. 检查task-outputs目录
ls -la task-outputs/cmlofnd4f0009vudax7y8hq2z/

# 7. 在浏览器中approve或decline结果
```

## 输出文件

执行完成后，文件保存在：
```
task-outputs/<taskId>/
├── report.md       # Markdown源文件
└── report.pdf      # 生成的PDF报告
```

## 环境变量

### 可选配置
```bash
# 设置邮件接收地址（如果要真实发送邮件）
export AGENT_EMAIL="your-email@example.com"

# gog需要OAuth认证
gog auth
```

## MCP数据库结构

```sql
SELECT id, name, description, endpoint, "pricePerCall" FROM "Mcp";
```

| Name | Endpoint | Price |
|------|----------|-------|
| Markdown to PDF Converter | cli://pandoc | 200 |
| Gmail Sender | cli://gog | 150 |
| Web Scraper | https://mcp.ibwt.io/web-scraper | 100 |

## 下一步

### 集成OpenClaw（未来）
当需要更复杂的AI工作流时，可以集成OpenClaw：

1. 配置MCP服务器到OpenClaw
2. Agent executor调用OpenClaw执行AI任务
3. OpenClaw使用配置的MCP工具完成工作

### 真实邮件发送
要启用真实邮件发送：

```bash
# 1. 认证gog
gog auth

# 2. 设置收件人
export AGENT_EMAIL="user@example.com"

# 3. 在agent-executor.ts中取消注释邮件发送代码
```

## 故障排除

### PDF生成失败
```bash
# 检查pandoc和weasyprint是否安装
which pandoc
which weasyprint

# 重新安装
brew install pandoc
pip3 install weasyprint
```

### 邮件发送失败
```bash
# 检查gog认证状态
gog auth status

# 重新认证
gog auth
```

### 任务状态异常
```bash
# 重置数据库
pnpm db:seed

# 检查任务状态
npx prisma studio
```

## API端点

- `GET /api/dashboard/tasks` - 获取任务列表
- `GET /api/dashboard/tasks/[id]` - 获取任务详情
- `POST /api/dashboard/tasks` - 创建任务
- `POST /api/dashboard/tasks/[id]/accept-bid` - 接受bid
- `POST /api/dashboard/tasks/[id]/submit-result` - 提交结果
- `POST /api/dashboard/tasks/[id]/approve` - 批准结果
- `POST /api/dashboard/tasks/[id]/decline` - 拒绝结果
