import "@1771technologies/lytenyte-core/grid.css";
import type {
  Grid as G,
  RowLayout,
  RowNormalRowLayout,
} from "@1771technologies/lytenyte-core/types";
import { Grid } from "@1771technologies/lytenyte-core";
import { memo, type ReactNode } from "react";

export function LyteNyte<T>({ grid }: { grid: G<T> }) {
  const view = grid.view.useValue();

  return (
    <div className="lng-grid lng1771-shadcn w-full h-full">
      <Grid.Root grid={grid}>
        <Grid.Viewport>
          <Grid.Header>
            {view.header.layout.map((headerRow, i) => {
              return (
                <Grid.HeaderRow headerRowIndex={i} key={i}>
                  {headerRow.map((headerCell) => {
                    if (headerCell.kind === "group")
                      return (
                        <Grid.HeaderGroupCell
                          cell={headerCell}
                          key={headerCell.idOccurrence}
                        />
                      );

                    return (
                      <Grid.HeaderCell
                        className="group relative flex items-center px-2"
                        cell={headerCell}
                        key={headerCell.id}
                      />
                    );
                  })}
                </Grid.HeaderRow>
              );
            })}
          </Grid.Header>
          <Grid.RowsContainer>
            <Grid.RowsTop>
              <RowHandler rows={view.rows.top} />
            </Grid.RowsTop>
            <Grid.RowsCenter>
              <RowHandler rows={view.rows.center} />
            </Grid.RowsCenter>
            <Grid.RowsBottom>
              <RowHandler rows={view.rows.bottom} />
            </Grid.RowsBottom>
          </Grid.RowsContainer>
        </Grid.Viewport>
      </Grid.Root>
    </div>
  );
}

const RowHandler = <T,>(props: { rows: RowLayout<T>[] }) => {
  return props.rows.map((row) => {
    if (row.kind === "full-width")
      return <Grid.RowFullWidth key={row.id} row={row} />;

    return <Row key={row.id} row={row} />;
  });
};
function RowImpl<T>({ row }: { row: RowNormalRowLayout<T> }) {
  return (
    <Grid.Row key={row.id} row={row}>
      {row.cells.map((cell) => {
        return (
          <Grid.Cell
            className="flex items-center px-2"
            cell={cell}
            key={cell.id}
          />
        );
      })}
    </Grid.Row>
  );
}

const Row = memo(RowImpl) as <T>(props: {
  row: RowNormalRowLayout<T>;
}) => ReactNode;
