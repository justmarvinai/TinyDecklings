import { useNoticeStore } from '@/state/noticeStore';
import { Button, IconChip } from '@/ui/design/primitives';
import styles from './SystemNotices.module.css';

/**
 * The banner for things the game has to admit about itself.
 *
 * Sits under the HUD rather than over the screen, so it never covers what the
 * player is doing, and every one can be dismissed — a warning that cannot be
 * cleared is a warning the player learns to ignore.
 */
export function SystemNotices() {
  const notices = useNoticeStore((s) => s.notices);
  const dismiss = useNoticeStore((s) => s.dismiss);
  if (notices.length === 0) return null;

  return (
    <div className={styles.stack} role="alert">
      {notices.map((notice) => (
        <div
          key={notice.id}
          className={`${styles.notice} ${notice.tone === 'danger' ? styles.danger : ''}`}
        >
          <IconChip name="ui.info" size={24} />
          <div className={styles.text}>
            <span className={styles.title}>{notice.title}</span>
            <span className={styles.body}>{notice.body}</span>
          </div>
          <Button
            variant="neutral"
            icon="ui.close"
            iconOnly
            aria-label={`Dismiss: ${notice.title}`}
            onClick={() => dismiss(notice.id)}
          />
        </div>
      ))}
    </div>
  );
}
