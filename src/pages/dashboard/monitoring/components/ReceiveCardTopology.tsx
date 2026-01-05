import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { ZoomIn, ZoomOut, RotateCcw, Cpu, Thermometer, Droplets, Cable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ReceiveCardPortData } from '../types';

// 扁平化的接收卡Tile数据
export interface ReceiveCardTile {
  key: string;  // `${netPortNum}:${receiveCardNum}`
  netPortNum: number;
  receiveCardNum: number;
  bitErrorRate: number;
  temperature: number;
  humidity: number;
  smoke: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface ReceiveCardTopologyProps {
  ports: ReceiveCardPortData[];
  onSelectCard: (tile: ReceiveCardTile) => void;
  selectedCard: ReceiveCardTile | null;
  className?: string;
}

// 默认Tile尺寸（无坐标时使用）
const DEFAULT_TILE_WIDTH = 140;
const DEFAULT_TILE_HEIGHT = 80;
const TILE_GAP = 12;
const PORT_GAP = 24;

export function ReceiveCardTopology({
  ports,
  onSelectCard,
  selectedCard,
  className,
}: ReceiveCardTopologyProps) {
  const { t } = useTranslation();
  
  // 扁平化所有接收卡
  const tiles = useMemo<ReceiveCardTile[]>(() => {
    const result: ReceiveCardTile[] = [];
    ports.forEach((port) => {
      port.receiveCards?.forEach((card) => {
        result.push({
          key: `${port.netPortNum}:${card.receiveCardNum}`,
          netPortNum: port.netPortNum,
          receiveCardNum: card.receiveCardNum,
          bitErrorRate: card.bitErrorRate,
          temperature: card.temperature,
          humidity: card.humidity,
          smoke: card.smoke ?? 0,
          x: card.x,
          y: card.y,
          width: card.width,
          height: card.height,
        });
      });
    });
    return result;
  }, [ports]);

  // 检测是否有坐标数据（用于判断使用哪种布局）
  const hasCoordinates = useMemo(() => {
    return tiles.some((t) => t.x !== undefined && t.y !== undefined);
  }, [tiles]);

  // 计算画布尺寸
  const canvasSize = useMemo(() => {
    if (hasCoordinates) {
      // 根据坐标计算边界
      let maxX = 0;
      let maxY = 0;
      tiles.forEach((t) => {
        const right = (t.x ?? 0) + (t.width ?? DEFAULT_TILE_WIDTH);
        const bottom = (t.y ?? 0) + (t.height ?? DEFAULT_TILE_HEIGHT);
        if (right > maxX) maxX = right;
        if (bottom > maxY) maxY = bottom;
      });
      return { width: maxX + 40, height: maxY + 40 };
    } else {
      // Grid布局：按Port分组
      const cardsPerRow = 4;
      let totalHeight = 0;
      ports.forEach((port) => {
        const cardCount = port.receiveCards?.length || 0;
        const rows = Math.ceil(cardCount / cardsPerRow);
        totalHeight += 32 + rows * (DEFAULT_TILE_HEIGHT + TILE_GAP) + PORT_GAP;
      });
      return {
        width: cardsPerRow * (DEFAULT_TILE_WIDTH + TILE_GAP) + 40,
        height: Math.max(totalHeight, 300),
      };
    }
  }, [tiles, ports, hasCoordinates]);

  // 渲染Tile
  const renderTile = (tile: ReceiveCardTile, x: number, y: number, w: number, h: number) => {
    const isSelected = selectedCard?.key === tile.key;

    // BER数值越大颜色越深（仅作视觉层次，非阈值告警）
    const berIntensity = Math.min(tile.bitErrorRate * 10000, 1); // 0-1 范围
    const bgOpacity = 0.05 + berIntensity * 0.15;

    return (
      <g
        key={tile.key}
        transform={`translate(${x}, ${y})`}
        onClick={() => onSelectCard(tile)}
        style={{ cursor: 'pointer' }}
      >
        {/* 背景 */}
        <rect
          width={w}
          height={h}
          rx={8}
          fill={isSelected ? 'hsl(var(--primary) / 0.15)' : `hsl(var(--muted) / ${bgOpacity})`}
          stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
          strokeWidth={isSelected ? 2 : 1}
          className="transition-all duration-150"
        />

        {/* 标题行 */}
        <text
          x={8}
          y={16}
          fontSize={10}
          fontWeight={600}
          fill="currentColor"
          className="select-none"
        >
          Port {tile.netPortNum} · Card {tile.receiveCardNum}
        </text>

        {/* BER */}
        <text
          x={8}
          y={32}
          fontSize={9}
          fill="hsl(var(--muted-foreground))"
          className="select-none"
        >
          BER: {tile.bitErrorRate.toFixed(6)}
        </text>

        {/* 温度 & 湿度 */}
        <text
          x={8}
          y={48}
          fontSize={9}
          fill="hsl(var(--muted-foreground))"
          className="select-none"
        >
          T: {tile.temperature}°C  H: {tile.humidity}%
        </text>

        {/* 选中指示器 */}
        {isSelected && (
          <circle
            cx={w - 12}
            cy={12}
            r={4}
            fill="hsl(var(--primary))"
          />
        )}
      </g>
    );
  };

  // 渲染Grid布局（无坐标时降级）
  const renderGridLayout = () => {
    const cardsPerRow = 4;
    let currentY = 20;
    const elements: React.ReactNode[] = [];

    ports.forEach((port, portIndex) => {
      // Port标签
      elements.push(
        <text
          key={`port-label-${port.netPortNum}`}
          x={20}
          y={currentY + 12}
          fontSize={11}
          fontWeight={700}
          fill="hsl(var(--muted-foreground))"
          className="select-none uppercase"
        >
          Port {port.netPortNum}
        </text>
      );
      currentY += 28;

      // 该Port下的Cards
      port.receiveCards?.forEach((card, cardIndex) => {
        const col = cardIndex % cardsPerRow;
        const row = Math.floor(cardIndex / cardsPerRow);
        const x = 20 + col * (DEFAULT_TILE_WIDTH + TILE_GAP);
        const y = currentY + row * (DEFAULT_TILE_HEIGHT + TILE_GAP);

        const tile = tiles.find(
          (t) => t.netPortNum === port.netPortNum && t.receiveCardNum === card.receiveCardNum
        );
        if (tile) {
          elements.push(renderTile(tile, x, y, DEFAULT_TILE_WIDTH, DEFAULT_TILE_HEIGHT));
        }
      });

      const cardCount = port.receiveCards?.length || 0;
      const rows = Math.ceil(cardCount / cardsPerRow);
      currentY += rows * (DEFAULT_TILE_HEIGHT + TILE_GAP) + PORT_GAP;
    });

    return elements;
  };

  // 渲染坐标布局
  const renderCoordinateLayout = () => {
    return tiles.map((tile) => {
      const x = tile.x ?? 0;
      const y = tile.y ?? 0;
      const w = tile.width ?? DEFAULT_TILE_WIDTH;
      const h = tile.height ?? DEFAULT_TILE_HEIGHT;
      return renderTile(tile, x + 20, y + 20, w, h);
    });
  };

  if (tiles.length === 0) {
    return (
      <Card className={cn('rounded-lg border bg-card shadow-sm', className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center opacity-40">
          <Cpu className="h-12 w-12 mb-3" />
          <p className="text-sm font-bold">{t('monitoring.status.awaitingData')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('rounded-lg border bg-card shadow-sm overflow-hidden', className)}>
      <CardHeader className="p-3 pb-2 flex flex-row items-center justify-between space-y-0 bg-muted/30 border-b">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-indigo-500/10">
            <Cpu className="h-3.5 w-3.5 text-indigo-500" />
          </div>
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-foreground/70">
            {t('monitoring.receiveCard.topology')}
          </CardTitle>
          <Badge variant="outline" className="text-[9px] font-bold h-5 px-2 rounded-full ml-2">
            {tiles.length} {t('monitoring.receiveCard.cards')}
          </Badge>
        </div>
        {!hasCoordinates && (
          <Badge variant="secondary" className="text-[9px] font-bold h-5 px-2 rounded-full">
            {t('monitoring.receiveCard.gridLayout')}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0 relative">
        <TransformWrapper
          initialScale={1}
          minScale={0.5}
          maxScale={2}
          centerOnInit
        >
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              {/* 缩放控制按钮 */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-background/80 backdrop-blur-sm rounded-md p-1 border shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => zoomIn()}
                  title={t('common.actions.open')}
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => zoomOut()}
                  title={t('common.actions.close')}
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-sm"
                  onClick={() => resetTransform()}
                  title={t('common.actions.refresh')}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* 拓扑画布 */}
              <TransformComponent
                wrapperStyle={{
                  width: '100%',
                  height: '400px',
                  cursor: 'grab',
                }}
                contentStyle={{
                  width: canvasSize.width,
                  height: canvasSize.height,
                }}
              >
                <svg
                  width={canvasSize.width}
                  height={canvasSize.height}
                  className="text-foreground"
                >
                  {hasCoordinates ? renderCoordinateLayout() : renderGridLayout()}
                </svg>
              </TransformComponent>
            </>
          )}
        </TransformWrapper>

        {/* 选中提示 */}
        {!selectedCard && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-bold text-muted-foreground/50 uppercase tracking-widest">
            {t('monitoring.receiveCard.clickHint')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}