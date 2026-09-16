/**
 * Coluna — o design system do Basalto.
 *
 * O consumidor importa o CSS UMA vez, na raiz do aplicativo:
 *
 *   import "@slipalison/coluna/styles.css";
 *
 * Ele não é importado daqui de dentro de propósito. Um `import "./styles.css"`
 * neste arquivo entra em qualquer bundle que toque em qualquer componente, e
 * quem só quer um tipo acaba carregando a folha inteira — inclusive em teste,
 * inclusive em Node. Deixar a folha explícita custa uma linha ao consumidor e
 * devolve o controle de quando ela entra.
 */

export { ThemeProvider, useTheme } from "./theme/ThemeProvider";
export type {
  ResolvedTheme,
  ThemeContextValue,
  ThemePreference,
  ThemeProviderProps,
} from "./theme/ThemeProvider";

export { Badge } from "./atoms/Badge";
export type { BadgeProps } from "./atoms/Badge";
export { Button } from "./atoms/Button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./atoms/Button";
export { Divider } from "./atoms/Divider";
export type { DividerProps } from "./atoms/Divider";
export { Grid } from "./atoms/Grid";
export type { GridProps } from "./atoms/Grid";
export { Icon, iconNames } from "./atoms/Icon";
export type { IconName, IconProps } from "./atoms/Icon";
export { Slat } from "./atoms/Slat";
export type { SlatProps } from "./atoms/Slat";
export { Stack } from "./atoms/Stack";
export type { Space, StackProps } from "./atoms/Stack";
export { Surface } from "./atoms/Surface";
export type { SurfaceProps } from "./atoms/Surface";
export { Text } from "./atoms/Text";
export type { TextProps, TextTone, TextVariant } from "./atoms/Text";
export { VisuallyHidden } from "./atoms/VisuallyHidden";
export type { VisuallyHiddenProps } from "./atoms/VisuallyHidden";

export { ListRow } from "./molecules/ListRow";
export type { ListRowProps } from "./molecules/ListRow";
export { MacroBar } from "./molecules/MacroBar";
export type { MacroBarProps } from "./molecules/MacroBar";
export { Notice } from "./molecules/Notice";
export type { NoticeProps } from "./molecules/Notice";
export { SegmentedControl } from "./molecules/SegmentedControl";
export type { SegmentedControlProps, SegmentedOption } from "./molecules/SegmentedControl";
export { Stat } from "./molecules/Stat";
export type { StatProps } from "./molecules/Stat";
export { Stepper } from "./molecules/Stepper";
export type { StepperProps } from "./molecules/Stepper";

export { readToken, semanticTokens } from "./tokens/tokens";
export type { SemanticToken } from "./tokens/tokens";
