"use client";

import * as React from "react";
import Select, {
  Props as SelectProps,
  GroupBase,
  StylesConfig,
  ClassNamesConfig,
  components,
  DropdownIndicatorProps,
  ClearIndicatorProps,
} from "react-select";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Custom indicators using lucide icons ── */
function DropdownIndicator<O, M extends boolean, G extends GroupBase<O>>(
  props: DropdownIndicatorProps<O, M, G>
) {
  return (
    <components.DropdownIndicator {...props}>
      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
    </components.DropdownIndicator>
  );
}

function ClearIndicator<O, M extends boolean, G extends GroupBase<O>>(
  props: ClearIndicatorProps<O, M, G>
) {
  return (
    <components.ClearIndicator {...props}>
      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
    </components.ClearIndicator>
  );
}

/* ── Strip all react-select inline styles ── */
function buildStyles<
  O,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>
>(): StylesConfig<O, M, G> {
  const reset = () => ({});
  return {
    control: reset,
    valueContainer: reset,
    input: reset,
    placeholder: reset,
    singleValue: reset,
    multiValue: reset,
    multiValueLabel: reset,
    multiValueRemove: reset,
    indicatorsContainer: reset,
    indicatorSeparator: reset,
    clearIndicator: reset,
    dropdownIndicator: reset,
    menu: reset,
    menuList: reset,
    option: reset,
    noOptionsMessage: reset,
    loadingMessage: reset,
    group: reset,
    groupHeading: reset,
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  };
}

/* ── Tailwind classNames that match shadcn Input/Select exactly ── */
function buildClassNames<
  O,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>
>(): ClassNamesConfig<O, M, G> {
  return {
    container: () => "relative w-full",

    control: ({ isFocused, isDisabled }) =>
      cn(
        "flex h-9 w-full cursor-pointer items-center rounded-lg border bg-card pl-3 pr-1 text-sm shadow-sm transition-all dark:bg-input/20",
        isFocused
          ? "border-ring ring-2 ring-ring/25 outline-none"
          : "border-input",
        !isFocused && "hover:border-foreground/30",
        isDisabled && "pointer-events-none bg-muted opacity-50 cursor-not-allowed"
      ),

    valueContainer: () => "flex flex-1 flex-wrap items-center gap-1 overflow-hidden",
    input: () => "m-0 p-0 text-sm text-foreground caret-foreground",
    placeholder: () => "text-sm text-muted-foreground select-none truncate",
    singleValue: () => "text-sm text-foreground truncate",

    /* Multi-value chips */
    multiValue: () =>
      "flex items-center gap-0.5 rounded bg-muted border border-border px-1.5 py-0.5",
    multiValueLabel: () => "text-xs font-medium text-foreground leading-none",
    multiValueRemove: () =>
      "ml-0.5 rounded p-0.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",

    /* Chevron / clear */
    indicatorsContainer: () => "flex items-center gap-0.5 pr-0.5 shrink-0",
    indicatorSeparator: () => "hidden",
    clearIndicator: () =>
      "flex items-center rounded p-0.5 transition-colors hover:bg-muted cursor-pointer",
    dropdownIndicator: () =>
      "flex items-center rounded p-0.5 transition-colors hover:bg-muted cursor-pointer",

    /* Dropdown menu */
    menu: () =>
      "absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-border bg-white shadow-lg shadow-black/8 dark:bg-popover",
    menuList: () => "py-1 max-h-60 overflow-y-auto",

    option: ({ isSelected, isFocused }) =>
      cn(
        "flex cursor-pointer items-center px-2.5 py-1.5 text-sm transition-colors select-none",
        isSelected
          ? "bg-primary/10 text-foreground font-medium"
          : isFocused
          ? "bg-muted text-foreground"
          : "text-foreground"
      ),

    noOptionsMessage: () =>
      "px-3 py-6 text-sm text-center text-muted-foreground",
    loadingMessage: () =>
      "px-3 py-6 text-sm text-center text-muted-foreground",

    group: () => "py-0",
    groupHeading: () =>
      "px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
  };
}

/* ── Component ── */
export type ReactSelectProps<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>
> = Omit<SelectProps<O, M, G>, "classNames" | "styles" | "unstyled"> & {
  className?: string;
};

function ReactSelect<
  O = unknown,
  M extends boolean = false,
  G extends GroupBase<O> = GroupBase<O>
>({ className, ...props }: ReactSelectProps<O, M, G>) {
  return (
    <div className={cn("w-full", className)}>
      <Select<O, M, G>
        unstyled
        styles={buildStyles<O, M, G>()}
        classNames={buildClassNames<O, M, G>()}
        components={{ DropdownIndicator, ClearIndicator } as never}
        menuPosition="absolute"
        menuPortalTarget={typeof document !== "undefined" ? document.body : undefined}
        {...props}
      />
    </div>
  );
}

export { ReactSelect };
