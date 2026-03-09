# OpenAgents Workspace + Claude Agent SDK Integration Research

## Overview

This document explores how to use [OpenAgents](https://openagents.org) workspaces to run Claude as an agent via API, and whether the Claude Agent SDK can be integrated.

---

## OpenAgents Workspace — How It Works

OpenAgents workspaces are persistent agent environments where multiple agents connect, communicate, and collaborate.

### Setup

```bash
pip install -U openagents

# Initialize a workspace
openagents init ./my_network

# Start the network
openagents network start
# Or with config:
openagents network start config.yaml
```

### Workspace Structure

```
my_network/
├── agents/          # Agent Python/YAML configs
├── tools/           # Custom tools (auto-discovered)
├── events/          # AsyncAPI event definitions
└── network.yaml     # Network configuration
```

### Core API — `WorkerAgent` + `self.workspace()`

Agents subclass `WorkerAgent` and interact via the workspace API:

```python
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext

class MyAgent(WorkerAgent):
    default_agent_id = "my-agent"
    default_channels = ["general"]

    async def on_startup(self):
        ws = self.workspace()
        await ws.channel("general").post("I'm online!")

    async def on_direct(self, msg):
        ws = self.workspace()
        await ws.agent(msg.sender_id).send("Got your message!")

    async def on_channel_mention(self, context: ChannelMessageContext):
        # Respond when @mentioned in a channel
        await self.run_agent(context=context, instruction="Help the user")

if __name__ == "__main__":
    agent = MyAgent()
    agent.start(network_host="localhost", network_port=8700, network_id="main")
```

### Workspace API Methods

| Method | Description |
|--------|-------------|
| `ws.agent(id).send(msg)` | Direct message to agent |
| `ws.channel(name).post(msg)` | Post to channel |
| `ws.channel(name).reply(event_id, msg)` | Reply to message |
| `ws.channel(name).post_with_mention(text, id)` | Post with @mention |
| `ws.channel(name).add_reaction(msg_id, emoji)` | React to message |

---

## Using Claude as an LLM Provider in OpenAgents

OpenAgents has **native Claude support** via `AgentConfig`:

```python
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext
from openagents.models.agent_config import create_claude_config

class ClaudeAssistant(WorkerAgent):
    default_agent_id = "claude-assistant"
    default_channels = ["general"]

    def __init__(self):
        claude_config = create_claude_config(
            model_name="claude-sonnet-4-6",
            instruction="You are a helpful meeting notes assistant",
            api_key="your-anthropic-api-key"
        )
        super().__init__(agent_config=claude_config)

    async def on_channel_mention(self, context: ChannelMessageContext):
        await self.run_agent(
            context=context,
            instruction="Analyze the meeting notes and provide insights"
        )

if __name__ == "__main__":
    agent = ClaudeAssistant()
    agent.start(network_host="localhost", network_port=8700)
```

This uses the **Anthropic API directly** (chat completions) — not the Claude Agent SDK's agentic capabilities (file editing, shell commands, etc.).

---

## Bridging Claude Agent SDK into OpenAgents

To get **full Claude Code capabilities** (file ops, shell, code editing) inside an OpenAgents workspace, you can wrap the Claude Agent SDK:

```python
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext
from claude_agent_sdk import ClaudeSDKClient

class ClaudeCodeAgent(WorkerAgent):
    default_agent_id = "claude-code-agent"
    default_channels = ["dev"]

    def __init__(self):
        super().__init__()
        self.claude = ClaudeSDKClient()

    async def on_channel_mention(self, context: ChannelMessageContext):
        message = context.incoming_event.payload.get('content', {}).get('text', '')
        ws = self.workspace()

        # Run Claude Code agent with full tool access
        session = await self.claude.create_session(
            prompt=message,
            allowed_tools=["read", "edit", "bash", "glob", "grep"],
            working_directory="/path/to/project"
        )

        result = await session.run()

        await ws.channel(context.channel).reply(
            context.incoming_event.id,
            f"Result:\n```\n{result.text}\n```"
        )

if __name__ == "__main__":
    agent = ClaudeCodeAgent()
    agent.start(network_host="localhost", network_port=8700)
```

---

## Architecture Options

### Option 1: Claude as LLM Provider (Simple)

```
User → OpenAgents Workspace → Claude API (chat only)
```

- Uses `create_claude_config()` — built-in, zero extra code
- No file/shell access — pure conversation
- Good for: Q&A, summarization, analysis

### Option 2: Claude Agent SDK Wrapper (Full Power)

```
User → OpenAgents Workspace → WorkerAgent → Claude Agent SDK → Claude Code CLI
                                                                  ├── File ops
                                                                  ├── Shell commands
                                                                  └── Code editing
```

- Wraps `ClaudeSDKClient` inside a `WorkerAgent`
- Full Claude Code capabilities (read/write files, run commands)
- Good for: Code review, automated refactoring, CI/CD agents

### Option 3: MCP Bridge (Protocol-Native)

```
User → OpenAgents Workspace → MCP Server → Claude Desktop / Claude Code
```

- OpenAgents has native MCP support
- Claude Code can connect to MCP servers
- Bidirectional: Claude can call OpenAgents tools, OpenAgents can call Claude

---

## Recommendation for This Project

For the **AI Meeting Notes Agent**, the most practical integration would be:

1. **Option 1** for a quick start — Use OpenAgents workspace with Claude as LLM provider to create a collaborative meeting analysis agent that other agents can interact with

2. **Option 2** for advanced use — Wrap Claude Agent SDK to let the agent autonomously process transcripts, update atlas data, and commit changes

### Example: Meeting Notes Agent in OpenAgents Workspace

```python
from openagents.agents.worker_agent import WorkerAgent, ChannelMessageContext
from openagents.models.agent_config import create_claude_config

class MeetingNotesAgent(WorkerAgent):
    default_agent_id = "meeting-notes-ai"
    default_channels = ["meetings", "general"]

    def __init__(self):
        config = create_claude_config(
            model_name="claude-sonnet-4-6",
            instruction="""You are a meeting notes analyst. You:
            - Summarize key decisions and action items
            - Identify speakers and their contributions
            - Track follow-ups from previous meetings
            - Update the Decision Atlas with new insights""",
            api_key="your-anthropic-api-key"
        )
        super().__init__(agent_config=config)

    async def on_channel_post(self, context: ChannelMessageContext):
        message = context.incoming_event.payload.get('content', {}).get('text', '')

        # Auto-process messages that look like meeting transcripts
        if len(message) > 500 or 'transcript' in message.lower():
            await self.run_agent(
                context=context,
                instruction="Analyze this meeting transcript. Extract decisions, action items, and key insights."
            )

    async def on_direct(self, msg):
        ws = self.workspace()
        await self.run_agent(
            context=msg,
            instruction="Help with meeting notes analysis"
        )

if __name__ == "__main__":
    agent = MeetingNotesAgent()
    agent.start(network_host="localhost", network_port=8700)
```

---

## Sources

- [OpenAgents Overview](https://openagents.org/docs/en/getting-started/overview)
- [Python-based Agents Tutorial](https://openagents.org/docs/en/tutorials/python-based-agents)
- [LLM-based Agents Guide](https://openagents.org/docs/python-interface/work-with-llm-based-agents)
- [CLI Overview](https://openagents.org/docs/en/cli/cli-overview)
- [OpenAgents GitHub](https://github.com/openagents-org/openagents)
- [Claude Agent SDK Docs](https://platform.claude.com/docs/en/agent-sdk/overview)
- [OpenAgents vs Other Frameworks (2026)](https://openagents.org/blog/posts/2026-02-23-open-source-ai-agent-frameworks-compared)
