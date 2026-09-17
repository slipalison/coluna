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
export { Chip } from "./atoms/Chip";
export type { ChipProps } from "./atoms/Chip";
export { Divider } from "./atoms/Divider";
export type { DividerProps } from "./atoms/Divider";
export { Dot } from "./atoms/Dot";
export type { DotProps, DotTone } from "./atoms/Dot";
export { Grid } from "./atoms/Grid";
export type { GridProps } from "./atoms/Grid";
export { Icon, iconNames } from "./atoms/Icon";
export type { IconName, IconProps } from "./atoms/Icon";
export { Input } from "./atoms/Input";
export type { InputProps } from "./atoms/Input";
export { Screen } from "./atoms/Screen";
export type { ScreenProps } from "./atoms/Screen";
export { Series } from "./atoms/Series";
export type { SeriesPoint, SeriesProps } from "./atoms/Series";
export { Slat } from "./atoms/Slat";
export type { SlatProps, SlatTone } from "./atoms/Slat";
export { Stack } from "./atoms/Stack";
export type { Space, StackProps } from "./atoms/Stack";
export { Surface } from "./atoms/Surface";
export type { SurfaceProps, SurfaceRadius } from "./atoms/Surface";
export { Text } from "./atoms/Text";
export type { TextProps, TextTone, TextVariant } from "./atoms/Text";
export { VisuallyHidden } from "./atoms/VisuallyHidden";
export type { VisuallyHiddenProps } from "./atoms/VisuallyHidden";

export { Diff } from "./molecules/Diff";
export type { DiffProps } from "./molecules/Diff";
export { Disclosure } from "./molecules/Disclosure";
export type { DisclosureProps } from "./molecules/Disclosure";
export { EmptyState } from "./molecules/EmptyState";
export type { EmptyStateProps } from "./molecules/EmptyState";
export { Field } from "./molecules/Field";
export type { FieldControl, FieldProps } from "./molecules/Field";
export { Group } from "./molecules/Group";
export type { GroupInset, GroupProps } from "./molecules/Group";
export { ListRow } from "./molecules/ListRow";
export type { ListRowProps } from "./molecules/ListRow";
export { MacroBar } from "./molecules/MacroBar";
export type { MacroBarProps, MacroKind } from "./molecules/MacroBar";
export { Notice } from "./molecules/Notice";
export type { NoticeProps } from "./molecules/Notice";
export { Rail } from "./molecules/Rail";
export type { RailItem, RailProps } from "./molecules/Rail";
export { Reckoning } from "./molecules/Reckoning";
export type { ReckoningLine, ReckoningProps } from "./molecules/Reckoning";
export { ScreenHeader } from "./molecules/ScreenHeader";
export type { ScreenHeaderProps } from "./molecules/ScreenHeader";
export { SegmentedControl } from "./molecules/SegmentedControl";
export type { SegmentedControlProps, SegmentedOption } from "./molecules/SegmentedControl";
export { Sheet } from "./molecules/Sheet";
export type { SheetProps } from "./molecules/Sheet";
export { Stat } from "./molecules/Stat";
export type { StatProps } from "./molecules/Stat";
export { Stepper } from "./molecules/Stepper";
export type { StepperProps } from "./molecules/Stepper";
export { TabBar } from "./molecules/TabBar";
export type { TabBarProps, TabItem } from "./molecules/TabBar";

export { readToken, semanticTokens } from "./tokens/tokens";
export type { SemanticToken } from "./tokens/tokens";
