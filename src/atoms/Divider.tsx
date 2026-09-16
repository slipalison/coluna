import type { HTMLAttributes } from "react";

export type DividerProps = HTMLAttributes<HTMLHRElement>;

/** Fio de 1px no token de linha. `<hr>` porque a separação também é semântica. */
export function Divider({ className, ...resto }: DividerProps) {
  const classe = className ? `co-divider ${className}` : "co-divider";
  return <hr className={classe} {...resto} />;
}
