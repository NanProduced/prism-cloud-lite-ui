import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { RealtimeMetric, ReceiveCardPortData } from '../types';
import { ReceiveCardTopology, type ReceiveCardTile } from './ReceiveCardTopology';
import { ReceiveCardDetailDrawer } from './ReceiveCardDetailDrawer';

interface ReceiveCardTabProps {
  deviceId: number;  // 单设备模式
  metrics: Record<string, RealtimeMetric>;
  className?: string;
}

/**
 * 接收卡独立Tab
 * 显示物理拓扑视图 + 下钻详情Drawer
 */
export function ReceiveCardTab({
  deviceId,
  metrics,
  className,
}: ReceiveCardTabProps) {
  const [selectedCard, setSelectedCard] = useState<ReceiveCardTile | null>(null);

  // 从metrics中提取接收卡数据
  const ports = useMemo<ReceiveCardPortData[]>(() => {
    const result: ReceiveCardPortData[] = [];

    Object.values(metrics).forEach((metric) => {
      if (metric.reportType !== 'bitErrorRate' && metric.reportType !== 'receiveCard') return;

      const value = metric.value;

      // Handle nested array structure
      let portData: ReceiveCardPortData[] = [];
      if (Array.isArray(value)) {
        portData = value as ReceiveCardPortData[];
      } else if (value?.sensorValue && Array.isArray(value.sensorValue)) {
        portData = value.sensorValue as ReceiveCardPortData[];
      }

      // Merge ports
      portData.forEach((port) => {
        const existingPort = result.find((p) => p.netPortNum === port.netPortNum);
        if (existingPort) {
          // Merge cards into existing port
          port.receiveCards?.forEach((card) => {
            const existingCard = existingPort.receiveCards?.find(
              (c) => c.receiveCardNum === card.receiveCardNum
            );
            if (!existingCard) {
              existingPort.receiveCards = existingPort.receiveCards || [];
              existingPort.receiveCards.push(card);
            }
          });
        } else {
          result.push({ ...port });
        }
      });
    });

    // Sort by port number
    return result.sort((a, b) => a.netPortNum - b.netPortNum);
  }, [metrics]);

  const handleSelectCard = (tile: ReceiveCardTile) => {
    setSelectedCard(tile);
  };

  const handleCloseDrawer = () => {
    setSelectedCard(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 物理拓扑视图 */}
      <ReceiveCardTopology
        ports={ports}
        onSelectCard={handleSelectCard}
        selectedCard={selectedCard}
      />

      {/* 下钻详情Drawer */}
      <ReceiveCardDetailDrawer
        open={!!selectedCard}
        onClose={handleCloseDrawer}
        deviceId={deviceId}
        card={selectedCard}
      />
    </div>
  );
}
