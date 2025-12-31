import { Plus, MonitorPlay, History, MessageSquare, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const actions = [
  { label: 'Add Device', icon: Plus, path: '/dashboard/devices', color: 'bg-blue-500' },
  { label: 'Create Program', icon: PlusCircle, path: '/dashboard/programs', color: 'bg-indigo-500' },
  { label: 'View Logs', icon: History, path: '/dashboard/logs', color: 'bg-slate-500' },
  { label: 'Messages', icon: MessageSquare, path: '/dashboard/messages', color: 'bg-emerald-500' },
];

export const QuickActionsWidget = () => {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 gap-2 h-full">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={() => navigate(action.path)}
          className="flex flex-col items-center justify-center p-3 rounded-xl border border-muted bg-card hover:bg-accent hover:text-accent-foreground transition-all group"
        >
          <div className={cn("p-2 rounded-lg mb-2 text-white transition-transform group-hover:scale-110", action.color)}>
            <action.icon className="h-4 w-4" />
          </div>
          <span className="text-[10px] font-semibold text-center leading-tight">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
