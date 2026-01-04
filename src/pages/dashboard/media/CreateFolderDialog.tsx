import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const trimmed = name.trim();
  const canCreate = trimmed.length > 0;

  const description = useMemo(() => {
    if (!parentLabel) return t('media.dialogs.createFolder.desc');
    return t('media.dialogs.createFolder.descIn', { parent: parentLabel });
  }, [parentLabel, t]);

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
          <DialogTitle>{t('media.dialogs.createFolder.title')}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t('media.dialogs.createFolder.label')}</label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('media.dialogs.createFolder.placeholder')}
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
            {t('common.actions.cancel')}
          </Button>
          <Button onClick={submit} disabled={!canCreate}>
            {t('common.actions.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}