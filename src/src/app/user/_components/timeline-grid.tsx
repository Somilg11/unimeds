'use client';

import { Badge } from '@/components/ui/badge';
import { Calendar, FileText, Activity, Pill } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TimelineItem as TimelineItemType } from '@/types/user';

interface TimelineGridProps {
  items: TimelineItemType[];
  className?: string;
}

export function TimelineGrid({ items, className }: TimelineGridProps) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const getIcon = (type: TimelineItemType['type']) => {
    switch (type) {
      case 'record':
        return <FileText className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'prescription':
        return <Pill className="w-4 h-4" />;
      case 'lab_result':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variantMap: Record<string, 'default' | 'secondary' | 'outline'> = {
      confirmed: 'default',
      pending: 'secondary',
      cancelled: 'outline',
      completed: 'default',
      processing: 'secondary',
    };

    return (
      <Badge 
        variant={variantMap[status] || 'secondary'} 
        className="text-[10px] tracking-widest uppercase font-bold"
      >
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={cn('space-y-3 sm:space-y-4', className)}>
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="relative pl-4 sm:pl-6 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-zinc-200 group"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-zinc-500 group-hover:text-zinc-900 transition-colors">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[10px] tracking-widest uppercase font-bold text-zinc-500">
                  {formatDate(item.date)}
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="text-sm sm:text-base font-semibold text-zinc-900 mt-1 tracking-tight">
                {item.title}
              </div>
              {item.description && (
                <div className="text-xs text-zinc-600 mt-1">
                  {item.description}
                </div>
              )}
              {item.metadata?.doctorName && (
                <div className="text-[10px] tracking-widest uppercase font-bold text-zinc-500 mt-1">
                  {item.metadata.doctorName}
                </div>
              )}
              {item.metadata?.location && (
                <div className="text-[10px] text-zinc-600">
                  {item.metadata.location}
                </div>
              )}
              {item.metadata?.recordType && (
                <Badge 
                  variant="outline" 
                  className="text-[8px] tracking-widest uppercase font-bold mt-2 border-dashed"
                >
                  {item.metadata.recordType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
      {sortedItems.length === 0 && (
        <div className="text-center py-8 sm:py-12 border-2 border-dashed border-zinc-300 rounded-lg">
          <Activity className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
          <p className="text-sm text-zinc-600 font-medium">No timeline items yet</p>
        </div>
      )}
    </div>
  );
}
