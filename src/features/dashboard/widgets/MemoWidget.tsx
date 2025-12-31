import { useState, useEffect } from 'react';
import { StickyNote } from 'lucide-react';

export const MemoWidget = () => {
  const [content, setContent] = useState(() => 
    localStorage.getItem('prism.dashboard.memo') || ''
  );

  useEffect(() => {
    localStorage.setItem('prism.dashboard.memo', content);
  }, [content]);

  return (
    <div className="flex flex-col h-full bg-amber-50/50 dark:bg-amber-900/5 rounded-lg p-1">
      <div className="flex items-center gap-2 mb-2 px-1">
        <StickyNote className="h-3 w-3 text-amber-500" />
        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase">Sticky Note</span>
      </div>
      <textarea
        className="flex-1 w-full bg-transparent resize-none border-none focus:ring-0 text-xs p-1 placeholder:text-amber-200 dark:placeholder:text-amber-900/40"
        placeholder="Type your notes here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
    </div>
  );
};
