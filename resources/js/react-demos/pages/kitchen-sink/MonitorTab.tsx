import { useState, useMemo } from "react";
import {
  Chart,
  Badge,
  Timeline,
  Pagination,
  Accordion,
  Composer,
  Heading,
  Text,
  Separator,
} from "@particle-academy/react-fancy";
import type { KitchenSinkState, KitchenSinkAction } from "./types";

interface MonitorTabProps {
  state: KitchenSinkState;
  dispatch: React.Dispatch<KitchenSinkAction>;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MonitorTab({ state, dispatch }: MonitorTabProps) {
  const [execPage, setExecPage] = useState(1);
  const latestExec = state.executions[state.executions.length - 1];

  // Derive chart data from execution state so Chaos Mode mutations are visible
  const latencyData = useMemo(() => {
    const recent = state.executions.slice(-6);
    return {
      labels: recent.map((e) => formatTime(e.timestamp)),
      series: [{ label: "Latency (ms)", data: recent.map((e) => e.duration), color: "#6366f1" }],
    };
  }, [state.executions]);

  const tokenBarData = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const exec of state.executions) {
      for (const r of exec.nodeResults) {
        const node = state.nodes.find((n) => n.id === r.nodeId);
        const label = node?.type ?? r.nodeId;
        totals[label] = (totals[label] ?? 0) + r.latency;
      }
    }
    return Object.entries(totals).map(([label, value]) => ({ label, value }));
  }, [state.executions, state.nodes]);

  const statusDonutData = useMemo(() => {
    const counts = { success: 0, error: 0, timeout: 0 };
    for (const exec of state.executions) {
      counts[exec.status]++;
    }
    return [
      { label: "Success", value: counts.success, color: "#22c55e" },
      { label: "Error", value: counts.error, color: "#ef4444" },
      { label: "Timeout", value: counts.timeout, color: "#f59e0b" },
    ];
  }, [state.executions]);

  const handleChatSubmit = (content: string) => {
    dispatch({
      type: "ADD_CHAT_MESSAGE",
      payload: { id: `msg-${Date.now()}`, role: "user", content },
    });
    setTimeout(() => {
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: {
          id: `msg-${Date.now()}-reply`,
          role: "assistant",
          content: `I processed your request: "${content.slice(0, 60)}..." The pipeline completed with ${state.nodes.length} nodes.`,
        },
      });
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6">
      <Heading level={3}>Pipeline Analytics</Heading>
      <Text size="sm" muted>Real-time monitoring of agent execution metrics.</Text>
      <Separator />

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="overflow-hidden rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <Text size="sm" weight="semibold" className="mb-2">Latency Trend</Text>
          <Chart.Line labels={latencyData.labels} series={latencyData.series} height={160} responsive />
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <Text size="sm" weight="semibold" className="mb-2">Tokens by Node</Text>
          <Chart.Bar data={tokenBarData} height={160} showValues />
        </div>
        <div className="overflow-hidden rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
          <Text size="sm" weight="semibold" className="mb-2">Status Distribution</Text>
          <Chart.Donut data={statusDonutData} />
        </div>
      </div>

      {/* Executions Table */}
      <Accordion>
        <Accordion.Item value="executions">
          <Accordion.Trigger>
            <Text weight="semibold">Execution History ({state.executions.length} runs)</Text>
          </Accordion.Trigger>
          <Accordion.Content>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 dark:border-zinc-700">
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Time</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Duration</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Tokens</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-zinc-500">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {state.executions.map((exec) => (
                    <tr key={exec.id} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{formatTime(exec.timestamp)}</td>
                      <td className="px-3 py-2">{exec.duration}ms</td>
                      <td className="px-3 py-2">{exec.tokens}</td>
                      <td className="px-3 py-2">
                        <Badge
                          size="sm"
                          color={exec.status === "success" ? "green" : exec.status === "error" ? "red" : "amber"}
                          variant="soft"
                        >
                          {exec.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Chart.Sparkline
                          data={exec.nodeResults.map((r) => r.latency)}
                          width={80}
                          height={24}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <Pagination page={execPage} onPageChange={setExecPage} totalPages={3} />
            </div>
          </Accordion.Content>
        </Accordion.Item>
      </Accordion>

      {/* Execution Trace Timeline */}
      {latestExec && (
        <>
          <Heading level={4}>Latest Trace</Heading>
          <Timeline>
            {latestExec.nodeResults.map((result, i) => {
              const node = state.nodes.find((n) => n.id === result.nodeId);
              const isLast = i === latestExec.nodeResults.length - 1;
              return (
                <Timeline.Item
                  key={result.nodeId}
                  color={isLast && latestExec.status === "timeout" ? "amber" : "green"}
                  active={isLast}
                >
                  <p className="font-medium text-sm">{node?.label ?? result.nodeId}</p>
                  <p className="text-xs text-zinc-500">{result.output} ({result.latency}ms)</p>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </>
      )}

      <Separator />

      {/* Chat with Agent */}
      <Heading level={4}>Chat with Agent</Heading>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700">
        <div className="max-h-48 overflow-y-auto p-4 space-y-2">
          {state.chatMessages.length === 0 ? (
            <Text size="sm" muted>Send a message to test the agent.</Text>
          ) : (
            state.chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "ml-8 bg-blue-50 dark:bg-blue-900/20"
                    : "mr-8 bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {msg.content}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-zinc-200 p-3 dark:border-zinc-700">
          <Composer onSubmit={handleChatSubmit} placeholder="Ask the agent something..." />
        </div>
      </div>
    </div>
  );
}
