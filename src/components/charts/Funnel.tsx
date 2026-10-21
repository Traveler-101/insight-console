import { formatNumber } from '@/utils/format';

interface FunnelProps {
  stages: { stage: string; value: number }[];
}

/** 转化漏斗：宽度按首环节归一，右侧标注「相对上一环节」的转化率 */
export function Funnel({ stages }: FunnelProps) {
  const max = stages[0]?.value || 1;

  return (
    <div className="funnel">
      {stages.map((stage, index) => {
        const prev = index === 0 ? stage.value : stages[index - 1].value;
        const rate = prev === 0 ? 0 : (stage.value / prev) * 100;
        return (
          <div className="funnel-row" key={stage.stage}>
            <span className="funnel-name">{stage.stage}</span>
            <div className="funnel-track" title={`${stage.stage}：${formatNumber(stage.value)}`}>
              <div
                className="funnel-bar"
                style={{ width: `${Math.max(8, (stage.value / max) * 100)}%`, animationDelay: `${index * 70}ms` }}
              />
            </div>
            <span className="funnel-value">
              {index === 0 ? '—' : `${rate.toFixed(1)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
