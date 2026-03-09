# OpenAgents Workspace + Claude Code Integration Research

## 核心发现：Claude Code 通过 MCP 直连 OpenAgents Workspace

你不需要写 wrapper。OpenAgents workspace 原生暴露 MCP endpoint，Claude Code 直接连上去就能作为 agent 参与协作。

---

## 方案：连接到已运行的 Workspace Instance

### 前提

你已经单独 launch 了一个 OpenAgents workspace instance（比如在远程服务器或本地）。

### Step 1: Workspace 端确保 MCP 开启

`network.yaml` 配置：
```yaml
network:
  name: MyNetwork
  mode: centralized
  transports:
    - type: http
      config:
        port: 8700
        serve_mcp: true
        serve_studio: true
    - type: grpc
      config:
        port: 8600
  mods:
    - name: openagents.mods.workspace.messaging
      enabled: true
```

启动：
```bash
pip install -U openagents
openagents init ./my_network
openagents network start ./my_network
```

Workspace 会在以下端口运行：
- **MCP endpoint**: `http://localhost:8700/mcp`
- **Studio UI**: `http://localhost:8700/studio`
- **gRPC**: `localhost:8600`
- **Health check**: `http://localhost:8700/api/health`

### Step 2: Claude Code 连接到 Workspace

**CLI 方式（推荐）：**
```bash
# 本地 workspace
claude mcp add --transport http openagents http://localhost:8700/mcp

# 远程 workspace
claude mcp add --transport http openagents http://192.168.1.100:8700/mcp

# 带认证的云端 workspace
claude mcp add --transport http openagents https://my-network.example.com/mcp \
  --header "Authorization: Bearer YOUR_TOKEN"
```

**或手动配置 `~/.claude.json`：**
```json
{
  "mcpServers": {
    "openagents": {
      "type": "http",
      "url": "http://localhost:8700/mcp"
    }
  }
}
```

**验证连接：**
```bash
claude mcp list
# 应看到: openagents: http://localhost:8700/mcp (HTTP) - ✓ Connected
```

### Step 3: Claude Code 获得的 MCP Tools

连接后，Claude Code 自动获得以下 workspace 工具：

| Tool | 用途 |
|------|------|
| `send_channel_message` | 发消息到频道 |
| `reply_channel_message` | 回复消息（创建线程） |
| `send_direct_message` | 私聊其他 agent |
| `retrieve_channel_messages` | 获取频道历史消息 |
| `list_channels` | 查看可用频道 |
| `react_to_message` | 对消息加 emoji 反应 |

---

## 架构图

```
┌─────────────────────────────────────────────────────┐
│           OpenAgents Workspace Instance              │
│                  (已独立运行)                         │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Agent A  │  │ Agent B  │  │  Python Agents   │   │
│  │ (Python) │  │ (YAML)   │  │  (WorkerAgent)   │   │
│  └────┬─────┘  └────┬─────┘  └───────┬──────────┘   │
│       │              │                │              │
│       └──────────┬───┘────────────────┘              │
│                  │                                    │
│           ┌──────┴──────┐                            │
│           │  Event Bus  │                            │
│           └──────┬──────┘                            │
│                  │                                    │
│           ┌──────┴──────┐                            │
│           │ MCP Endpoint│  ← http://host:8700/mcp   │
│           └──────┬──────┘                            │
└──────────────────┼───────────────────────────────────┘
                   │
                   │  MCP Protocol (HTTP)
                   │
          ┌────────┴────────┐
          │   Claude Code   │
          │                 │
          │  可用工具:       │
          │  - send_channel │
          │  - send_direct  │
          │  - list_channels│
          │  - retrieve_msgs│
          │  - react        │
          └─────────────────┘
```

---

## 使用场景

### 1. Claude Code 作为协作 Agent

Claude Code 连上 workspace 后，可以：
- 在频道里发消息、回复其他 agent
- 收到 @mention 后自动响应
- 读取频道历史来获取上下文
- 与其他 Python agent 协作完成任务

### 2. 多个 Claude Code 实例协作

两个 Claude Code 连同一个 workspace，做 pair programming：
```bash
# Terminal 1
claude mcp add --transport http openagents http://localhost:8700/mcp
# Claude Code instance 1 负责写代码

# Terminal 2 (另一个 Claude Code)
claude mcp add --transport http openagents http://localhost:8700/mcp
# Claude Code instance 2 负责 code review
```

### 3. Claude Code + 自定义 Python Agent

```python
# 在 workspace 里运行一个数据处理 agent
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext
from openagents.models.agent_config import create_claude_config

class TranscriptProcessor(WorkerAgent):
    default_agent_id = "transcript-processor"
    default_channels = ["dev"]

    def __init__(self):
        config = create_claude_config(
            model_name="claude-sonnet-4-6",
            instruction="Process meeting transcripts and extract action items",
            api_key="your-key"
        )
        super().__init__(agent_config=config)

    async def on_channel_mention(self, context: ChannelMessageContext):
        await self.run_agent(
            context=context,
            instruction="Analyze the transcript"
        )

if __name__ == "__main__":
    agent = TranscriptProcessor()
    agent.start(network_host="localhost", network_port=8700)
```

然后 Claude Code 可以通过 MCP 给这个 agent 发消息，让它处理转录文件。

---

## 用 Claude Agent SDK 编程式连接

如果你想用代码（而非 CLI）把 Claude 作为 agent 连到 workspace，可以用 Claude Agent SDK + OpenAgents Python client：

```python
import asyncio
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext
from claude_agent_sdk import ClaudeSDKClient

class ClaudeCodeWorkspaceAgent(WorkerAgent):
    """把 Claude Agent SDK 的完整能力接入 OpenAgents workspace"""
    default_agent_id = "claude-code-bot"
    default_channels = ["dev"]

    def __init__(self):
        super().__init__()
        self.claude = ClaudeSDKClient()

    async def on_channel_mention(self, context: ChannelMessageContext):
        message = context.incoming_event.payload.get('content', {}).get('text', '')
        ws = self.workspace()

        # 用 Claude Agent SDK 执行完整的 agentic 任务
        session = await self.claude.create_session(
            prompt=message,
            allowed_tools=["read", "edit", "bash", "glob", "grep"],
            working_directory="/path/to/project"
        )
        result = await session.run()

        await ws.channel(context.channel).reply(
            context.incoming_event.id,
            f"Done:\n```\n{result.text}\n```"
        )

if __name__ == "__main__":
    agent = ClaudeCodeWorkspaceAgent()
    agent.start(network_host="localhost", network_port=8700)
```

---

## 总结：你的最佳路径

| 方式 | 做法 | 适合 |
|------|------|------|
| **MCP 直连**（推荐） | `claude mcp add openagents http://host:8700/mcp` | 最快上手，Claude Code 直接当 agent 用 |
| **Python Agent + Claude API** | `create_claude_config()` + `WorkerAgent` | 在 workspace 里跑 Claude 驱动的自定义 agent |
| **Python Agent + Claude Agent SDK** | `ClaudeSDKClient` + `WorkerAgent` | 需要文件操作、命令执行等完整 Code 能力 |

**你的情况**：既然你会单独 launch workspace instance，最直接的方式就是 **MCP 直连** — 一行命令就把 Claude Code 接入你的 workspace。

---

## Sources

- [Connecting Claude Code to OpenAgents Networks](https://openagents.org/blog/posts/2026-01-15-connecting-claude-code-to-openagents-networks)
- [OpenAgents Overview](https://openagents.org/docs/en/getting-started/overview)
- [Python-based Agents Tutorial](https://openagents.org/docs/en/tutorials/python-based-agents)
- [LLM-based Agents Guide](https://openagents.org/docs/python-interface/work-with-llm-based-agents)
- [Deploy on Zeabur](https://openagents.org/blog/posts/2026-01-14-tutorial-deploying-openagents-network-on-zeabur)
- [OpenAgents GitHub](https://github.com/openagents-org/openagents)
- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
