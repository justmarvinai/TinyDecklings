import { useRef, useState } from 'react';
import { SaveImportError, type SaveService } from '@/services/saves';
import { usePlayerStore } from '@/state/playerStore';
import { useNoticeStore } from '@/state/noticeStore';
import { Button, Modal, Panel } from '@/ui/design/primitives';
import styles from './BackupSection.module.css';

function backupFilename(nowMs: number): string {
  return `tinydecklings-${new Date(nowMs).toISOString().slice(0, 10)}.json`;
}

/**
 * Manual backup (Q27).
 *
 * The game is offline and single-player, so a save lives in one browser and one
 * browser only — clearing site data would take it with no warning. This is the
 * answer: a readable file the player owns, and a way to put it back.
 *
 * Restoring replaces everything, so it is checked first, confirmed second, and
 * reloads afterwards rather than swapping the world out from under a running game.
 */
export function BackupSection({ saves }: { saves: SaveService }) {
  const save = usePlayerStore((s) => s.save);
  const [restoring, setRestoring] = useState<{ text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!save) return null;

  const download = () => {
    const blob = new Blob([saves.export(save)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = backupFilename(save.updatedAtMs || save.createdAtMs);
    link.click();
    URL.revokeObjectURL(url);
  };

  const copy = () => {
    void navigator.clipboard?.writeText(saves.export(save)).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () =>
        useNoticeStore.getState().notify({
          id: 'backup.copy-failed',
          tone: 'warning',
          title: 'Could not copy',
          body: 'This browser refused clipboard access. Use "Save to file" instead.',
        }),
    );
  };

  return (
    <div className={styles.section}>
      <div className={styles.row}>
        <Button variant="info" onClick={download}>
          Save to file
        </Button>
        <Button variant="neutral" onClick={copy}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
        <Button variant="warning" onClick={() => setRestoring({ text: '' })}>
          Restore
        </Button>
      </div>

      <p className={styles.hint}>
        Your progress lives in this browser and nowhere else — clearing site data would take it with
        it. A backup is a plain file you can read, keep, and put back.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className={styles.file}
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (!file) return;
          void file.text().then((text) => setRestoring({ text }));
        }}
      />

      {restoring ? (
        <RestoreSheet
          saves={saves}
          initial={restoring.text}
          onPickFile={() => fileRef.current?.click()}
          onClose={() => setRestoring(null)}
        />
      ) : null}
    </div>
  );
}

function RestoreSheet({
  saves,
  initial,
  onPickFile,
  onClose,
}: {
  saves: SaveService;
  initial: string;
  onPickFile: () => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const readable = (failure: unknown) =>
    failure instanceof SaveImportError
      ? failure.message
      : 'That backup could not be read. Try the file you exported.';

  // Checked before it is confirmed, so the warning is never shown for a file that
  // was never going to load anyway.
  const check = () => {
    try {
      saves.import(text);
      setError(null);
      setConfirming(true);
    } catch (failure) {
      setError(readable(failure));
    }
  };

  const restore = () => {
    try {
      const doc = saves.import(text);
      void saves.replace(doc).then(() => window.location.reload());
    } catch (failure) {
      setError(readable(failure));
      setConfirming(false);
    }
  };

  return (
    <Modal title="Restore a backup" onClose={onClose}>
      <div className={styles.sheet}>
        {confirming ? (
          <>
            <Panel tone="raised">
              <p className="u-prose">
                This replaces everything — your collection, your gear, your place on the road. What
                is here now will be gone, and there is no undo.
              </p>
            </Panel>
            <Button variant="danger" block onClick={restore}>
              Replace my save
            </Button>
            <Button variant="neutral" block onClick={() => setConfirming(false)}>
              Back
            </Button>
          </>
        ) : (
          <>
            <p className="u-prose">Paste a backup, or choose the file you saved.</p>
            <textarea
              className={styles.input}
              value={text}
              rows={6}
              spellCheck={false}
              aria-label="Backup contents"
              placeholder='{ "saveVersion": … }'
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
            />
            {error ? <p className={styles.error}>{error}</p> : null}
            <Button variant="info" block onClick={onPickFile}>
              Choose a file
            </Button>
            <Button variant="positive" block disabled={text.trim().length === 0} onClick={check}>
              Check this backup
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
