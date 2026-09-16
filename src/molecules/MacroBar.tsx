import { Slat } from "../atoms/Slat";
import { Stack } from "../atoms/Stack";
import { Text } from "../atoms/Text";

export interface MacroBarProps {
  /** "Proteína", "Carboidrato", "Gordura" — ou qualquer par nome/quantidade. */
  name: string;
  value: number;
  target: number;
  unit?: string;
  size?: "md" | "sm";
  className?: string | undefined;
}

/**
 * Nome, quanto de quanto, e a ripa.
 *
 * A barra NAO e grampeada em 100% por acidente: passar do alvo e informacao,
 * nao falha. O componente mostra o excedente pela largura cheia e pelo numero
 * ao lado, e nao muda de cor para vermelho — este sistema nao repreende quem
 * comeu mais do que planejou.
 */
export function MacroBar({ name, value, target, unit = "g", size = "md", className }: MacroBarProps) {
  const fracao = target > 0 ? value / target : 0;
  return (
    <Stack gap={6} className={className}>
      <Stack direction="row" gap={12} justify="space-between" align="baseline">
        <Text variant="caption" tone="secondary">
          {name}
        </Text>
        <Text variant="caption" tone="muted" numeric>
          {value} / {target} {unit}
        </Text>
      </Stack>
      <Slat value={fracao} size={size} label={`${name}: ${value} de ${target} ${unit}`} />
    </Stack>
  );
}
