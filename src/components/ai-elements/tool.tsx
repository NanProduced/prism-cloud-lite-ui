import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, CircleDashed, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

function safeStringify(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function getToolName(toolPart: any): string {
  if (!toolPart) return '';
  if (toolPart.type === 'dynamic-tool') return String(toolPart.toolName || '');
  if (typeof toolPart.type === 'string' && toolPart.type.startsWith('tool-')) return toolPart.type.slice('tool-'.length);
  return '';
}

function getToolLabel(toolName: string): string {
  switch (toolName) {
    case 'pickDevice':
      return '选择设备';
    case 'pickCommandLog':
      return '选择指令';
    case 'navigateToPage':
      return '页面跳转';
    case 'getDeviceDetail':
      return '设备详情';
    case 'diagnoseDevice':
      return '设备诊断';
    case 'analyzeOfflineDevices':
      return '离线设备概览';
    case 'searchCommandLogs':
      return '指令日志检索';
    case 'getRecentPublishFailures':
      return '发布失败概览';
    case 'getErrorCodeHelp':
      return '错误码参考';
    case 'diagnoseDeviceCommand':
      return '指令排查';
    default:
      return toolName || '工具';
  }
}

function asArray(value: any): any[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: any): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function asNumber(value: any): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

function asIdString(value: any): string | undefined {
  if (typeof value === 'string') {
    const s = value.trim();
    return s.length > 0 ? s : undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  return undefined;
}

function formatBytes(bytes?: number) {
  if (!bytes || !Number.isFinite(bytes) || bytes <= 0) return undefined;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : v >= 10 ? 1 : 2;
  return `${v.toFixed(digits)} ${units[i]}`;
}

function getStateLabel(state?: string) {
  switch (state) {
    case 'input-streaming':
      return '参数生成中';
    case 'input-available':
      return '待处理';
    case 'approval-requested':
      return '等待授权';
    case 'approval-responded':
      return '已授权';
    case 'output-available':
      return '已完成';
    case 'output-error':
      return '失败';
    case 'output-denied':
      return '已拒绝';
    default:
      return state || '未知';
  }
}

function getStateTone(state?: string): 'default' | 'success' | 'danger' {
  if (state === 'output-available' || state === 'approval-responded') return 'success';
  if (state === 'output-error' || state === 'output-denied') return 'danger';
  return 'default';
}

export function Tool({
  toolPart,
  addToolOutput,
  disabled,
  defaultOpen = false,
  className,
}: {
  toolPart: any;
  addToolOutput?: (options: any) => void;
  disabled?: boolean;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const toolName = useMemo(() => getToolName(toolPart), [toolPart]);
  const toolLabel = useMemo(() => getToolLabel(toolName), [toolName]);
  const state: string | undefined = toolPart?.state;
  const tone = getStateTone(state);
  const stateLabel = getStateLabel(state);

  const canInteract = !disabled && !toolPart?.providerExecuted;

  useEffect(() => {
    if (open) return;
    if (!canInteract) return;
    if (state !== 'input-available') return;
    if (toolName === 'pickDevice' || toolName === 'pickCommandLog') {
      setOpen(true);
    }
  }, [canInteract, open, state, toolName]);

  const headerBadgeClass = cn(
    'border',
    tone === 'success' && 'bg-emerald-500/10 text-emerald-700 border-emerald-200/60',
    tone === 'danger' && 'bg-red-500/10 text-red-700 border-red-200/60',
    tone === 'default' && 'bg-blue-500/10 text-blue-700 border-blue-200/60',
  );

  const icon =
    tone === 'success' ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : tone === 'danger' ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <CircleDashed className={cn('h-4 w-4', state === 'input-streaming' ? 'animate-spin' : '')} />
    );

  const handleCopy = (value: unknown) => {
    navigator.clipboard.writeText(typeof value === 'string' ? value : safeStringify(value));
  };

  const handleResult = (result: any) => {
    if (!addToolOutput || !canInteract) return;
    addToolOutput({
      toolCallId: toolPart.toolCallId,
      tool: toolName,
      state: 'output-available',
      output: result,
    });
  };

  const renderBody = () => {
    if (!toolPart) return null;

    if (toolName === 'navigateToPage') {
      const path = toolPart?.input?.path;
      const label = toolPart?.input?.label;
      return (
        <div className="space-y-2 text-xs">
          <div className="text-muted-foreground">将跳转到页面：</div>
          <div className="flex items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2">
            <div className="truncate font-medium">{label || path || '未知路径'}</div>
            {path ? (
              <a
                href={path}
                className="inline-flex items-center gap-1 text-primary hover:underline"
                onClick={(e) => e.preventDefault()}
              >
                <ExternalLink className="h-3.5 w-3.5" /> 跳转
              </a>
            ) : null}
          </div>
          {state === 'input-streaming' || state === 'input-available' ? (
            <div className="text-[11px] text-muted-foreground">前端将自动执行跳转…</div>
          ) : null}
        </div>
      );
    }

    if (toolName === 'pickDevice') {
      const { title, hint, items, includeFleetOption } = toolPart?.input || {};
      if (state === 'input-available' && canInteract) {
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold">{title || '请选择设备'}</div>
              {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
            </div>
            <div className="space-y-2">
              {(items || []).map((item: any) => (
                <Button
                  key={String(item.deviceId)}
                  variant="outline"
                  className="h-auto w-full justify-between gap-3 rounded-xl px-3 py-2 text-left"
                  onClick={() => handleResult({ deviceId: String(item.deviceId) })}
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{item.label}</div>
                    {item.lastReportTime ? (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">最后上报：{item.lastReportTime}</div>
                    ) : null}
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.online ? 'Online' : 'Offline'}
                  </Badge>
                </Button>
              ))}
              {includeFleetOption ? (
                <Button variant="secondary" className="h-9 w-full rounded-xl" onClick={() => handleResult({ fleet: true })}>
                  查看全量统计
                </Button>
              ) : null}
            </div>
          </div>
        );
      }
    }

    if (toolName === 'pickCommandLog') {
      const { title, hint, items } = toolPart?.input || {};
      if (state === 'input-available' && canInteract) {
        return (
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="text-xs font-semibold">{title || '请选择日志'}</div>
              {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
            </div>
            <div className="space-y-2">
              {(items || []).map((item: any) => (
                <Button
                  key={String(item.commandLogId)}
                  variant="outline"
                  className="h-auto w-full justify-between gap-3 rounded-xl px-3 py-2 text-left"
                  onClick={() => handleResult({ commandLogId: String(item.commandLogId) })}
                >
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{item.deviceName}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.actionType} · {item.createdAt}
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {item.status}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        );
      }
    }

    const output = toolPart.output;

    if (state === 'output-available' && toolName === 'getDeviceDetail' && output && typeof output === 'object') {
      const deviceId = asIdString((output as any).deviceId);
      const deviceName = asString((output as any).deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
      const onlineStatus = (output as any).onlineStatus;
      const isOnline = onlineStatus === 1 || onlineStatus === '1' || onlineStatus === true;
      const model = asString((output as any).model);
      const version = asString((output as any).version);
      const lastReportTime = asString((output as any).lastReportTime);
      const playingProgram = asString((output as any).playingProgram);
      const resolution = asString((output as any).resolution);
      const totalStorage = asNumber((output as any).totalStorage);
      const freeStorage = asNumber((output as any).freeStorage);

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{deviceName}</div>
              {deviceId ? <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">#{deviceId}</div> : null}
            </div>
            <Badge variant="secondary" className={cn('text-[10px]', isOnline ? 'bg-emerald-500/10 text-emerald-700' : 'bg-zinc-500/10 text-zinc-700')}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {model ? <div className="rounded-lg border bg-background px-2 py-1">型号：{model}</div> : null}
            {version ? <div className="rounded-lg border bg-background px-2 py-1">版本：{version}</div> : null}
            {resolution ? <div className="rounded-lg border bg-background px-2 py-1">分辨率：{resolution}</div> : null}
            {lastReportTime ? <div className="rounded-lg border bg-background px-2 py-1">最后上报：{lastReportTime}</div> : null}
            {playingProgram ? <div className="col-span-2 rounded-lg border bg-background px-2 py-1">播放节目：{playingProgram}</div> : null}
            {totalStorage ? (
              <div className="rounded-lg border bg-background px-2 py-1">
                存储：{formatBytes(freeStorage)} / {formatBytes(totalStorage)}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {deviceId ? (
              <Button asChild size="sm" className="h-8">
                <Link to={`/dashboard/devices/${deviceId}`}>打开设备详情</Link>
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleCopy(output)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              复制 JSON
            </Button>
          </div>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'diagnoseDevice' && output && typeof output === 'object') {
      const deviceId = asIdString((output as any).deviceId);
      const deviceName = asString((output as any).deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
      const issues = asArray((output as any).issues).map((x) => String(x));
      const actions = asArray((output as any).recommendedActions).map((x) => String(x));
      const lastSeenMinutes = asNumber((output as any).lastSeenMinutes);

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{deviceName}</div>
              {deviceId ? <div className="mt-0.5 font-mono text-[11px] text-muted-foreground">#{deviceId}</div> : null}
            </div>
            {typeof lastSeenMinutes === 'number' ? (
              <Badge variant="secondary" className="text-[10px]">
                {lastSeenMinutes} 分钟未上报
              </Badge>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground">发现的问题</div>
            <ul className="list-disc space-y-1 pl-4">
              {issues.map((t, i) => (
                <li key={i} className="text-foreground/90">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-muted-foreground">建议操作</div>
            <ul className="list-disc space-y-1 pl-4">
              {actions.map((t, i) => (
                <li key={i} className="text-foreground/90">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2">
            {deviceId ? (
              <Button asChild size="sm" className="h-8">
                <Link to={`/dashboard/devices/${deviceId}`}>打开设备详情</Link>
              </Button>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleCopy(output)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              复制 JSON
            </Button>
          </div>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'analyzeOfflineDevices' && output && typeof output === 'object') {
      const offlineCount = asNumber((output as any).offlineCount) ?? 0;
      const limit = asNumber((output as any).limit);
      const items = asArray((output as any).items);

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-muted-foreground">离线设备概览</div>
            <Badge variant="secondary" className="text-[10px]">
              {offlineCount} 台{typeof limit === 'number' ? `（最多 ${limit}）` : ''}
            </Badge>
          </div>
          <div className="space-y-2">
            {items.slice(0, 30).map((row: any) => {
              const deviceId = asIdString(row?.deviceId);
              const deviceName = asString(row?.deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
              const lastReportTime = asString(row?.lastReportTime);
              const model = asString(row?.model);
              return (
                <div key={String(deviceId ?? deviceName)} className="flex items-center justify-between gap-3 rounded-xl border bg-background px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-medium">{deviceName}</div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                      {deviceId ? <span className="font-mono">#{deviceId}</span> : null}
                      {model ? <span>{model}</span> : null}
                      {lastReportTime ? <span>最后上报：{lastReportTime}</span> : null}
                    </div>
                  </div>
                  {deviceId ? (
                    <Button asChild variant="outline" size="sm" className="h-8 shrink-0">
                      <Link to={`/dashboard/devices/${deviceId}`}>查看</Link>
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            复制 JSON
          </Button>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'searchCommandLogs' && output && typeof output === 'object') {
      const count = asNumber((output as any).count) ?? 0;
      const sinceMinutes = asNumber((output as any).sinceMinutes);
      const hint = asString((output as any).hint);
      const items = asArray((output as any).items);

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-muted-foreground">指令日志候选</div>
            <Badge variant="secondary" className="text-[10px]">
              {count} 条{typeof sinceMinutes === 'number' ? ` · 最近 ${sinceMinutes} 分钟` : ''}
            </Badge>
          </div>
          {hint ? <div className="text-[11px] text-muted-foreground">{hint}</div> : null}
          <div className="space-y-2">
            {items.slice(0, 20).map((row: any) => {
              const commandLogId = row?.commandLogId;
              const deviceId = asIdString(row?.deviceId);
              const deviceName = asString(row?.deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
              const actionType = asString(row?.actionType);
              const statusText = asString(row?.status);
              const createdAt = asString(row?.createdAt);
              const logsLink = deviceId ? `/dashboard/logs?tab=terminal&deviceId=${deviceId}` : '/dashboard/logs?tab=terminal';
              return (
                <div key={String(commandLogId ?? `${deviceName}-${createdAt ?? ''}`)} className="rounded-xl border bg-background px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{deviceName}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {deviceId ? <span className="font-mono">#{deviceId}</span> : null}
                        {actionType ? <span>{actionType}</span> : null}
                        {createdAt ? <span>{createdAt}</span> : null}
                      </div>
                    </div>
                    {statusText ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {statusText}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Button asChild variant="outline" size="sm" className="h-8">
                      <Link to={logsLink}>打开日志页</Link>
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleCopy(row)}>
                      <Copy className="mr-1.5 h-3.5 w-3.5" />
                      复制此条
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            复制 JSON
          </Button>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'diagnoseDeviceCommand' && output && typeof output === 'object') {
      const found = (output as any).found;
      const summary = asString((output as any).summary) || '';
      const suggestedNextQuestions = asArray((output as any).suggestedNextQuestions).map((x) => String(x));

      if (found === false) {
        return (
          <div className="space-y-3 text-xs">
            <div className="text-[11px] font-semibold text-muted-foreground">指令排查</div>
            {summary ? <div className="text-foreground/90">{summary}</div> : null}
            {suggestedNextQuestions.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground">建议补充信息</div>
                <ul className="list-disc space-y-1 pl-4">
                  {suggestedNextQuestions.map((t, i) => (
                    <li key={i} className="text-foreground/90">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              复制 JSON
            </Button>
          </div>
        );
      }

      const device = (output as any).device ?? {};
      const command = (output as any).command ?? {};
      const analysis = (output as any).analysis ?? {};
      const candidates = asArray((output as any).candidates);

      const deviceId = asIdString(device?.deviceId);
      const deviceName = asString(device?.deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
      const online = device?.online === true || device?.online === 1;
      const lastReportTime = asString(device?.lastReportTime);

      const commandLogId = asIdString(command?.commandLogId);
      const actionType = asString(command?.actionType);
      const statusText = asString(command?.status);
      const accepted = typeof command?.accepted === 'boolean' ? command.accepted : undefined;
      const covered = typeof command?.covered === 'boolean' ? command.covered : undefined;
      const sendMethod = asString(command?.sendMethod);
      const createdAt = asString(command?.createdAt);
      const ageMinutes = asNumber(command?.ageMinutes);
      const trackingWindowActive =
        typeof command?.trackingWindowActive === 'boolean' ? command.trackingWindowActive : undefined;

      const analysisState = asString(analysis?.state);
      const likelyCauses = asArray(analysis?.likelyCauses).map((x) => String(x));
      const recommendedActions = asArray(analysis?.recommendedActions).map((x) => String(x));

      const logsLink = deviceId ? `/dashboard/logs?tab=terminal&deviceId=${deviceId}` : '/dashboard/logs?tab=terminal';

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] font-semibold text-muted-foreground">指令排查</div>
              {summary ? <div className="mt-1 text-foreground/90">{summary}</div> : null}
            </div>
            {analysisState || statusText ? (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {analysisState || statusText}
              </Badge>
            ) : null}
          </div>

          <div className="rounded-xl border bg-background px-3 py-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{deviceName}</div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                  {deviceId ? <span className="font-mono">#{deviceId}</span> : null}
                  {lastReportTime ? <span>最后上报：{lastReportTime}</span> : null}
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn('shrink-0 text-[10px]', online ? 'bg-emerald-500/10 text-emerald-700' : 'bg-zinc-500/10 text-zinc-700')}
              >
                {online ? 'Online' : 'Offline'}
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {deviceId ? (
                <Button asChild size="sm" className="h-8">
                  <Link to={`/dashboard/devices/${deviceId}`}>打开设备详情</Link>
                </Button>
              ) : null}
              <Button asChild variant="outline" size="sm" className="h-8">
                <Link to={logsLink}>打开日志页</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 px-3 py-2">
            <div className="text-[11px] font-medium text-muted-foreground">指令信息</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
              {commandLogId ? <div className="rounded-lg border bg-background px-2 py-1 font-mono">log #{commandLogId}</div> : null}
              {actionType ? <div className="rounded-lg border bg-background px-2 py-1">动作：{actionType}</div> : null}
              {statusText ? <div className="rounded-lg border bg-background px-2 py-1">状态：{statusText}</div> : null}
              {typeof accepted === 'boolean' ? (
                <div className="rounded-lg border bg-background px-2 py-1">已接受：{accepted ? '是' : '否'}</div>
              ) : null}
              {typeof covered === 'boolean' ? (
                <div className="rounded-lg border bg-background px-2 py-1">已覆盖：{covered ? '是' : '否'}</div>
              ) : null}
              {sendMethod ? <div className="rounded-lg border bg-background px-2 py-1">发送：{sendMethod}</div> : null}
              {createdAt ? <div className="col-span-2 rounded-lg border bg-background px-2 py-1">创建：{createdAt}</div> : null}
              {typeof ageMinutes === 'number' ? (
                <div className="rounded-lg border bg-background px-2 py-1">耗时：{ageMinutes} 分钟</div>
              ) : null}
              {typeof trackingWindowActive === 'boolean' ? (
                <div className="rounded-lg border bg-background px-2 py-1">
                  追踪窗口：{trackingWindowActive ? '仍在生效' : '已结束'}
                </div>
              ) : null}
            </div>
          </div>

          {likelyCauses.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground">可能原因</div>
              <ul className="list-disc space-y-1 pl-4">
                {likelyCauses.map((t, i) => (
                  <li key={i} className="text-foreground/90">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {recommendedActions.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground">建议操作</div>
              <ul className="list-disc space-y-1 pl-4">
                {recommendedActions.map((t, i) => (
                  <li key={i} className="text-foreground/90">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {candidates.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[11px] font-medium text-muted-foreground">其他候选指令</div>
              <div className="space-y-2">
                {candidates.slice(0, 10).map((row: any, idx: number) => {
                  const cLogId = asIdString(row?.commandLogId);
                  const cDeviceId = asIdString(row?.deviceId);
                  const cActionType = asString(row?.actionType);
                  const cStatus = asString(row?.status);
                  const cCreatedAt = asString(row?.createdAt);
                  const cLogsLink = cDeviceId ? `/dashboard/logs?tab=terminal&deviceId=${cDeviceId}` : logsLink;
                  return (
                    <div key={String(cLogId ?? idx)} className="rounded-xl border bg-background px-3 py-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium">{cLogId ? `log #${cLogId}` : '候选指令'}</div>
                          <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                            {cDeviceId ? <span className="font-mono">#{cDeviceId}</span> : null}
                            {cActionType ? <span>{cActionType}</span> : null}
                            {cCreatedAt ? <span>{cCreatedAt}</span> : null}
                          </div>
                        </div>
                        {cStatus ? (
                          <Badge variant="secondary" className="text-[10px]">
                            {cStatus}
                          </Badge>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="h-8">
                          <Link to={cLogsLink}>打开日志页</Link>
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleCopy(row)}>
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          复制此条
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            复制 JSON
          </Button>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'getRecentPublishFailures' && output && typeof output === 'object') {
      const count = asNumber((output as any).count) ?? 0;
      const sinceMinutes = asNumber((output as any).sinceMinutes);
      const items = asArray((output as any).items);

      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-muted-foreground">最近发布失败</div>
            <Badge variant="secondary" className="text-[10px]">
              {count} 条{typeof sinceMinutes === 'number' ? ` · 最近 ${sinceMinutes} 分钟` : ''}
            </Badge>
          </div>
          <div className="space-y-2">
            {items.slice(0, 20).map((row: any) => {
              const deviceId = asIdString(row?.deviceId);
              const deviceName = asString(row?.deviceName) || (deviceId ? `Device ${deviceId}` : '设备');
              const actionType = asString(row?.actionType);
              const finalStatus = asString(row?.finalStatus);
              const errorMessage = asString(row?.errorMessage);
              const createdAt = asString(row?.createdAt);
              return (
                <div key={String(row?.messageId ?? `${deviceName}-${createdAt ?? ''}`)} className="rounded-xl border bg-background px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs font-medium">{deviceName}</div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                        {deviceId ? <span className="font-mono">#{deviceId}</span> : null}
                        {actionType ? <span>{actionType}</span> : null}
                        {createdAt ? <span>{createdAt}</span> : null}
                      </div>
                    </div>
                    {finalStatus ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {finalStatus}
                      </Badge>
                    ) : null}
                  </div>
                  {errorMessage ? <div className="mt-2 text-[11px] text-muted-foreground">{errorMessage}</div> : null}
                  {deviceId ? (
                    <div className="mt-2">
                      <Button asChild variant="outline" size="sm" className="h-8">
                        <Link to={`/dashboard/devices/${deviceId}`}>打开设备详情</Link>
                      </Button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            复制 JSON
          </Button>
        </div>
      );
    }

    if (state === 'output-available' && toolName === 'getErrorCodeHelp' && output && typeof output === 'object') {
      const errorCode = asString((output as any).errorCode) || '未知';
      const context = asString((output as any).context) || '';
      const sources = asArray((output as any).sources);
      return (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[11px] font-semibold text-muted-foreground">错误码参考</div>
            <Badge variant="secondary" className="text-[10px] font-mono">
              {errorCode}
            </Badge>
          </div>
          {context ? (
            <details className="rounded-xl border bg-muted/10 px-3 py-2">
              <summary className="cursor-pointer select-none text-[11px] font-medium">上下文说明</summary>
              <pre className="mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground">
                {context}
              </pre>
            </details>
          ) : null}
          {sources.length > 0 ? (
            <div className="rounded-xl border bg-muted/10 px-3 py-2">
              <div className="text-[11px] font-medium text-muted-foreground">来源</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {sources.map((s: any, idx: number) => {
                  const url = asString(s?.url) || '';
                  const title = asString(s?.title) || url || `source-${idx + 1}`;
                  if (!url) return null;
                  return (
                    <a
                      key={String(s?.sourceId ?? idx)}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border bg-background px-2 py-1 text-xs hover:border-primary/30 hover:text-primary"
                    >
                      <ExternalLink className="h-3 w-3" />
                      <span className="max-w-[240px] truncate">{title}</span>
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 self-start" onClick={() => handleCopy(output)}>
            <Copy className="mr-1.5 h-3.5 w-3.5" />
            复制 JSON
          </Button>
        </div>
      );
    }

    if (state === 'output-error') {
      return (
        <div className="flex items-start gap-2 rounded-lg border border-red-200/60 bg-red-50/50 px-3 py-2 text-xs text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium">工具执行失败</div>
            <div className="mt-1 break-words text-red-700/90">{toolPart.errorText || '未知错误'}</div>
          </div>
        </div>
      );
    }

    if (state === 'output-available' || state === 'approval-responded' || state === 'output-denied') {
      const output = toolPart.output ?? toolPart.approval ?? null;
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs font-medium">输出</div>
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2" onClick={() => handleCopy(output)}>
              <Copy className="mr-1.5 h-3.5 w-3.5" />
              复制
            </Button>
          </div>
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {safeStringify(output)}
          </pre>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground">工具：{toolName || '未知工具'}</div>
        {toolPart?.input ? (
          <pre className="max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
            {safeStringify(toolPart.input)}
          </pre>
        ) : null}
      </div>
    );
  };

  return (
    <div className={cn('rounded-2xl border bg-muted/10 p-3', disabled && 'opacity-70', className)}>
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 items-center gap-2">
          <Badge variant="outline" className={cn('gap-2 px-2 py-1', headerBadgeClass)}>
            {icon}
            <span className="truncate text-[11px] font-semibold tracking-wide">
              {toolLabel} · {stateLabel}
            </span>
          </Badge>
          {toolPart?.title ? <span className="truncate text-xs text-muted-foreground">{toolPart.title}</span> : null}
        </div>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      {open ? <div className="mt-3">{renderBody()}</div> : null}
    </div>
  );
}
