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

  React.useEffect(() => {
    setLocalChecked(checked);
  }, [checked]);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

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
