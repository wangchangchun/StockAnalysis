import type { ChordShape } from "../../types/music";

interface ChordDiagramProps {
  shape: ChordShape;
  /** 圖形寬度（px），高度依比例縮放 */
  width?: number;
  className?: string;
}

const STRING_COUNT = 6;

/**
 * 單一和弦指板圖（直式：琴枕在上，左側為第六弦/低音 E）
 */
export function ChordDiagram({ shape, width = 160, className }: ChordDiagramProps) {
  const frettedValues = shape.frets.filter(
    (f): f is number => typeof f === "number" && f > 0,
  );
  const maxFret = frettedValues.length ? Math.max(...frettedValues) : 1;
  const minFret = frettedValues.length ? Math.min(...frettedValues) : 1;
  // 高把位和弦不從第 1 格畫起，改標示起始格數
  const baseFret = maxFret <= 4 ? 1 : minFret;
  const fretCount = Math.max(4, maxFret - baseFret + 1);

  // SVG 座標系統
  const stringGap = 24;
  const fretGap = 30;
  const left = 30;
  const top = 34;
  const gridWidth = stringGap * (STRING_COUNT - 1);
  const gridHeight = fretGap * fretCount;
  const viewWidth = left + gridWidth + 18;
  const viewHeight = top + gridHeight + 14;

  const stringX = (stringIndex: number) => left + stringIndex * stringGap;
  const fretY = (fret: number) => top + (fret - baseFret + 0.5) * fretGap;

  const dotRadius = 9;

  return (
    <svg
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      width={width}
      height={(width * viewHeight) / viewWidth}
      className={className}
      role="img"
      aria-label={`${shape.chordName} 和弦圖`}
    >
      {/* 琴枕或起始格數標示 */}
      {baseFret === 1 ? (
        <rect x={left - 1.5} y={top - 5} width={gridWidth + 3} height={5} rx={2} fill="#e2e8f0" />
      ) : (
        <text x={left - 10} y={top + fretGap * 0.5 + 4} fontSize={12} fill="#94a3b8" textAnchor="end">
          {baseFret}fr
        </text>
      )}

      {/* 琴格橫線 */}
      {Array.from({ length: fretCount + 1 }, (_, i) => (
        <line
          key={`fret-${i}`}
          x1={left}
          x2={left + gridWidth}
          y1={top + i * fretGap}
          y2={top + i * fretGap}
          stroke="#475569"
          strokeWidth={1}
        />
      ))}

      {/* 弦（左粗右細） */}
      {Array.from({ length: STRING_COUNT }, (_, i) => (
        <line
          key={`string-${i}`}
          x1={stringX(i)}
          x2={stringX(i)}
          y1={top}
          y2={top + gridHeight}
          stroke="#94a3b8"
          strokeWidth={1.8 - i * 0.18}
        />
      ))}

      {/* 弦頂端標記：o = 空弦、x = 悶音 */}
      {shape.frets.map((fret, i) => {
        const x = stringX(i);
        const y = top - 14;
        if (fret === "x") {
          return (
            <text key={`mark-${i}`} x={x} y={y} fontSize={13} fill="#f87171" textAnchor="middle" fontWeight={700}>
              ×
            </text>
          );
        }
        if (fret === 0) {
          return (
            <circle key={`mark-${i}`} cx={x} cy={y - 4} r={4.5} fill="none" stroke="#e2e8f0" strokeWidth={1.5} />
          );
        }
        return null;
      })}

      {/* 封閉橫按 */}
      {shape.barre && (
        <rect
          x={stringX(STRING_COUNT - shape.barre.fromString) - dotRadius}
          y={fretY(shape.barre.fret) - dotRadius}
          width={
            stringX(STRING_COUNT - shape.barre.toString) -
            stringX(STRING_COUNT - shape.barre.fromString) +
            dotRadius * 2
          }
          height={dotRadius * 2}
          rx={dotRadius}
          fill="#f59e0b"
          opacity={0.45}
        />
      )}

      {/* 手指按壓點 */}
      {shape.frets.map((fret, i) => {
        if (typeof fret !== "number" || fret === 0) return null;
        const x = stringX(i);
        const y = fretY(fret);
        const finger = shape.fingers[i];
        return (
          <g key={`dot-${i}`}>
            <circle cx={x} cy={y} r={dotRadius} fill="#f59e0b" />
            {finger != null && (
              <text x={x} y={y + 4} fontSize={11} fill="#1c1204" textAnchor="middle" fontWeight={700}>
                {finger}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
