import { DEFERRED_FEATURES, type DeferredFeatureId } from '@/ui/text/deferred';
import { Button, IconChip, Modal } from '@/ui/design/primitives';
import styles from './LockedFeatureSheet.module.css';

/**
 * What a locked affordance says when the player taps it (Q22).
 *
 * Every deferred system is visible but locked, and every one explains itself the
 * same way wherever it appears — the copy lives in `ui/text/deferred.ts`.
 */
export function LockedFeatureSheet({
  feature,
  onClose,
}: {
  feature: DeferredFeatureId;
  onClose: () => void;
}) {
  const def = DEFERRED_FEATURES[feature];
  return (
    <Modal title={def.name} onClose={onClose} placement="centered">
      <div className={styles.sheet}>
        <span className={styles.badge}>
          <IconChip name={def.icon} size={38} shape="square" />
          <IconChip name="ui.lock" size={20} className={styles.lock} />
        </span>
        <p className="u-prose">{def.blurb}</p>
        <p className={styles.when}>{def.when}</p>
        <Button variant="neutral" block onClick={onClose}>
          Got it
        </Button>
      </div>
    </Modal>
  );
}
