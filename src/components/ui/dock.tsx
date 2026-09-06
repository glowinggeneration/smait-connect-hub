import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Dock — a macOS-style magnifying action bar.
 *
 * Native implementation: magnification is derived from pointer distance and
 * applied with CSS transforms, so no animation dependency is required.
 */

const DEFAULT_SIZE = 40;
const DEFAULT_MAGNIFICATION = 60;
const DEFAULT_DISTANCE = 130;

const dockVariants = cva(
  "mx-auto flex h-[58px] w-max items-end gap-2 rounded-full border border-border bg-card/90 px-3 pb-2 backdrop-blur supports-[backdrop-filter]:bg-card/70 shadow-elevated",
);

interface DockContextValue {
  pointerX: number | null;
  size: number;
  magnification: number;
  distance: number;
}

const DockContext = React.createContext<DockContextValue>({
  pointerX: null,
  size: DEFAULT_SIZE,
  magnification: DEFAULT_MAGNIFICATION,
  distance: DEFAULT_DISTANCE,
});

export interface DockProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dockVariants> {
  size?: number;
  magnification?: number;
  distance?: number;
}

export const Dock = React.forwardRef<HTMLDivElement, DockProps>(
  (
    {
      className,
      children,
      size = DEFAULT_SIZE,
      magnification = DEFAULT_MAGNIFICATION,
      distance = DEFAULT_DISTANCE,
      ...props
    },
    ref,
  ) => {
    const [pointerX, setPointerX] = React.useState<number | null>(null);

    return (
      <div
        ref={ref}
        onPointerMove={(event) => {
          if (event.pointerType === "touch") return;
          setPointerX(event.clientX);
        }}
        onPointerLeave={() => setPointerX(null)}
        className={cn(dockVariants(), className)}
        {...props}
      >
        <DockContext.Provider value={{ pointerX, size, magnification, distance }}>
          {children}
        </DockContext.Provider>
      </div>
    );
  },
);
Dock.displayName = "Dock";

export interface DockIconProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const DockIcon = ({ className, children, ...props }: DockIconProps) => {
  const { pointerX, size, magnification, distance } = React.useContext(DockContext);
  const ref = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(size);

  React.useEffect(() => {
    if (pointerX === null || !ref.current) {
      setWidth(size);
      return;
    }
    const bounds = ref.current.getBoundingClientRect();
    const delta = Math.abs(pointerX - (bounds.left + bounds.width / 2));
    if (delta > distance) {
      setWidth(size);
      return;
    }
    const scale = 1 - delta / distance;
    setWidth(size + (magnification - size) * scale);
  }, [pointerX, size, magnification, distance]);

  return (
    <div
      ref={ref}
      style={{ width, height: width }}
      className={cn(
        "flex aspect-square cursor-pointer items-center justify-center rounded-full transition-[width,height] duration-150 ease-out",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
DockIcon.displayName = "DockIcon";

export { dockVariants };
