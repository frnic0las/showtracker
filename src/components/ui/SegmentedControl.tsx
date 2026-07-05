'use client';

interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label'?: string;
}

/**
 * iOS-style segmented control: a track of equal-width pill buttons where one
 * option is active at a time. Generic over `value`/`label` pairs so callers
 * supply their own tab identifiers with their union type preserved.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="mx-4 mt-1 mb-2 flex gap-0.5 rounded-sm bg-bg-secondary p-0.5"
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={`min-h-10 flex-1 rounded-[6px] py-2 text-[13px] font-semibold text-text-primary ${
              isActive ? 'bg-bg-elevated shadow-sm' : ''
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
