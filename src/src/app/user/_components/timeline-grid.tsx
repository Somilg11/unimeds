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
        className="text-[10px] font-mono uppercase tracking-wider"
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

  if (sortedItems.length === 0) {
    return (
      <div className={cn('text-center py-10 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50', className)}>
        <Activity className="mx-auto h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500 font-medium">No timeline items yet</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden shadow-sm', className)}>
      {sortedItems.map((item) => (
        <div
          key={item.id}
          className="bg-white p-4 hover:bg-gray-50/50 transition-colors group"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-gray-400 group-hover:text-blue-600 transition-colors shrink-0">
              {getIcon(item.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider">
                  {formatDate(item.date)}
                </p>
                {getStatusBadge(item.status)}
              </div>
              <p className="text-sm font-semibold text-gray-900 tracking-tight">
                {item.title}
              </p>
              {item.description && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.description}
                </p>
              )}
              {item.metadata?.doctorName && (
                <p className="text-[11px] font-mono uppercase text-gray-400 tracking-wider mt-1">
                  {item.metadata.doctorName}
                </p>
              )}
              {item.metadata?.location && (
                <p className="text-[11px] text-gray-500">
                  {item.metadata.location}
                </p>
              )}
              {item.metadata?.recordType && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] font-mono uppercase tracking-wider mt-2 border-dashed"
                >
                  {item.metadata.recordType}
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
