import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function CreateFolderDialog({
  open,
  onOpenChange,
  parentLabel,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentLabel: string;
  onCreate: (name: string) => void;
}) {
  const [name, setName] = useState('');

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  const description = useMemo(() => {
    if (!parentLabel) return 'Create a new folder.';
    return `Create a new folder in ${parentLabel}.`;
  }, [parentLabel]);

  const submit = () => {
    if (!canCreate) return;
    onCreate(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setName('');
      }}
    >
      <DialogContent className="w-[min(100vw-2rem,520px)] max-w-none p-6">
        <DialogHeader>
          <DialogTitle>New Folder</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">Folder name</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Campaign creatives"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                submit();
              }
            }}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!canCreate}>
            Create
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
