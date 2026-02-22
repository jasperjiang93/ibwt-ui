# 🚀 快速开始 - 完整任务执行流程

## 前提条件

✅ Solana钱包已连接（使用devnet）
✅ pandoc、gog、weasyprint已安装
✅ 数据库已seed（`pnpm db:seed`）

## 完整流程演示

### 1️⃣ 启动开发服务器

```bash
pnpm dev
```

服务器启动后访问：http://localhost:3000

### 2️⃣ 创建任务

1. 导航到：http://localhost:3000/dashboard/tasks
2. 点击 **"+ New Task"** 按钮
3. 与AI对话描述任务：

```
示例对话：
You: I need a market research report on DeFi protocols
AI: What's your budget in $IBWT tokens?
You: 5000 IBWT
AI: Any deadline?
You: By next week
AI: [分析并推荐agents...]
You: Yes, create it
```

4. 任务创建完成后，会自动显示2-3个agent的bids

### 3️⃣ 接受Bid

1. 在任务详情页，查看各个agent的报价
2. 点击某个bid的 **"Accept Bid"** 按钮
3. 钱包会弹出交易确认（Solana escrow lock_funds）
4. 确认交易后：
   - 资金锁定在escrow
   - 任务状态变为 **in_progress**

### 4️⃣ 执行任务（模拟Agent工作）

打开新终端，运行：

```bash
# 方法1: 自动找到in_progress的任务
npx tsx scripts/test-mcp-workflow.ts
# 会显示taskId和执行命令

# 方法2: 直接执行（替换taskId）
npx tsx scripts/agent-executor.ts <taskId>
```

执行器会：
- ✅ 生成Markdown报告
- ✅ 使用pandoc转换为PDF
- ✅ 准备邮件发送（gog）
- ✅ 提交结果到数据库
- ✅ 任务状态变为 **pending_review**

### 5️⃣ 审核结果并支付

1. 刷新浏览器中的任务详情页
2. 查看状态变为 **pending review**
3. 查看agent提交的deliverables
4. 两个选择：

   **选项A：批准并支付**
   - 点击 **"✓ Approve & Release Funds"** 按钮
   - 钱包弹出交易确认（Solana escrow approve）
   - 确认后：
     - 100%资金释放给agent
     - 任务状态变为 **completed**
     - 可在Solana Explorer查看交易

   **选项B：拒绝并退款**
   - 点击 **"✗ Decline & Refund"** 按钮
   - 钱包弹出交易确认（Solana escrow decline）
   - 确认后：
     - 100%资金退还给你
     - 任务状态变为 **cancelled**

### 6️⃣ 查看生成的文件

```bash
ls -lh task-outputs/<taskId>/
# 会看到：
# - report.md (Markdown源文件)
# - report.pdf (生成的PDF报告)
```

## 🎯 关键状态流转

```
open → in_progress → pending_review → completed/cancelled
  ↑         ↑              ↑               ↑
创建任务   接受bid      提交结果      批准/拒绝
         (锁定资金)                  (释放资金/退款)
```

## 💡 提示

### 查看in_progress的任务

```bash
npx tsx scripts/test-mcp-workflow.ts
```

### 启用真实邮件发送

```bash
# 1. 认证gog
gog auth

# 2. 设置收件人
export AGENT_EMAIL="your-email@example.com"

# 3. 执行任务（邮件会真实发送）
npx tsx scripts/agent-executor.ts <taskId>
```

### 查看数据库

```bash
npx prisma studio
```

### 重置数据库

```bash
pnpm db:seed
```

## 🔍 调试

### 检查任务状态

```bash
# 创建临时脚本查看任务
cat > check-task.ts << 'EOF'
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const taskId = process.argv[2];
prisma.task.findUnique({
  where: { id: taskId },
  include: { acceptedBid: true, result: true }
}).then(task => {
  console.log(JSON.stringify(task, null, 2));
  prisma.$disconnect();
});
EOF

npx tsx check-task.ts <taskId>
```

### 常见问题

**Q: 创建任务时budget提取失败？**
A: 在对话中明确说出数字，如"5000 IBWT"或"$5000"

**Q: Agent executor报错"fetch failed"？**
A: 确保开发服务器运行（`pnpm dev`）

**Q: PDF生成失败？**
A: 检查pandoc和weasyprint是否安装：
```bash
which pandoc
which weasyprint
```

**Q: 钱包交易失败？**
A: 确保：
- 连接到Solana devnet
- 钱包有足够的SOL（用于交易费）
- 使用正确的钱包地址

## 📊 完整示例输出

```bash
$ npx tsx scripts/agent-executor.ts cmlofndag00jrvudadj6u9zi2

🤖 Agent Executor starting for task cmlofndag00jrvudadj6u9zi2...

📋 Task: Create a market analysis report for DeFi protocols
💰 Budget: 5000 $IBWT
🤖 Agent: ResearchBot

📦 MCP Plan:
  1. Web Scraper: 14 calls × 100 = 1400 $IBWT
  2. Markdown to PDF Converter: 6 calls × 200 = 1200 $IBWT
  3. Gmail Sender: 1 calls × 150 = 150 $IBWT

🔧 Executing MCPs...

🌐 Web scraping simulated (14 calls)...
📄 Converting report to PDF using pandoc...
   ✅ PDF generated: .../report.pdf
📧 Preparing to send email via gog...
   📬 Recipient: user@example.com
   ⚠️  Email sending skipped (set AGENT_EMAIL env to enable)

✅ All MCPs executed successfully!

📤 Submitting results to API...

✅ Result submitted successfully!
   Status: pending_review

📁 Output files saved to: task-outputs/cmlofndag00jrvudadj6u9zi2/
```

## ✨ 现在可以开始了！

按照上面的步骤，你可以：
1. ✅ 创建真实任务
2. ✅ 执行真实MCP工具（pandoc、gog）
3. ✅ 审核结果
4. ✅ 通过Solana escrow确认支付或退款

整个流程完全可用！🎉
