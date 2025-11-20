import * as React from 'react';
import { Switch } from '@/components/ui/switch';
import { useDebounce } from '@/hooks/useDebounce';

interface DebouncedSwitchProps extends React.ComponentPropsWithoutRef<typeof Switch> {
  onCheckedChange?: (checked: boolean) => void;
  debounceTime?: number;
}

export function DebouncedSwitch({
  checked = false,
  onCheckedChange,
  debounceTime = 500,
  ...props
}: DebouncedSwitchProps) {
  const [localChecked, setLocalChecked] = React.useState(checked);
  const debouncedChecked = useDebounce(localChecked, debounceTime);
  const isFirstRender = React.useRef(true);

  // Sync local state with prop when prop changes
  // We only want to do this if the prop change wasn't caused by our own update
  // But since we can't easily know that, we'll just sync.
  // However, to avoid jitter if the user is clicking fast, we might want to skip this if we are "dirty"?
  // For now, let's trust the simple sync.
  React.useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Only trigger callback if the value is different from what we think the parent has
    // But we don't know what the parent has exactly, except via `checked` prop.
    // If `debouncedChecked` !== `checked`, it means we have a pending change that stabilized.
    if (debouncedChecked !== checked) {
      onCheckedChange?.(debouncedChecked);
    }
  }, [debouncedChecked, checked, onCheckedChange]);

  const handleCheckedChange = (newChecked: boolean) => {
    setLocalChecked(newChecked);
  };

  return (
    <Switch
      checked={localChecked}
      onCheckedChange={handleCheckedChange}
      {...props}
    />
  );
}
