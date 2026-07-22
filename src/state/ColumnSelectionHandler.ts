import type{ InteractionHandler } from "./InteractionHandler";
import type{ GridState } from "./GridState";
import { Grid } from "../grid/Grid";
import { GridConfig } from "../config/GridConfig";
import { GeometryHelpers } from "./GeometryHelpers";
import { IdleState } from "./IdleState";

export class ColumnSelectionHandler implements InteractionHandler, GridState {
    
    public isMatch(grid: Grid, event: PointerEvent): boolean {
        //Clicked within top bar bounds but NOT on a vertical split line
        return event.offsetY < GridConfig.HEADER_HEIGHT && event.offsetX >= GridConfig.HEADER_WIDTH && GeometryHelpers.getColResizeIndex(grid, event.offsetX) === null;
    }

    public execute(grid: Grid, event: PointerEvent): void {
        const absoluteWorldX = (event.offsetX - GridConfig.HEADER_WIDTH) + grid.getViewport().getScrollX();
        const colIndex = GeometryHelpers.getColumnAtX(grid, absoluteWorldX);
        
        grid.getSelection().selectColumn(colIndex);
        
        grid.changeState(new IdleState());
        grid.render();
    }

    public onPointerDown(grid: Grid, event: PointerEvent): void {}
    public onPointerMove(grid: Grid, event: PointerEvent): void {}
    public onPointerUp(grid: Grid, event: PointerEvent): void {}
}



