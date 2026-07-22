import { GridRenderer } from "./GridRenderer";
import { GridDataStore } from "../data/GridDataStore";
import { Viewport } from "./ViewPort";
import { Selection } from "./Selection";
import { Editor } from "./Editor";
import { Summary } from "./Summary";
import { CommandManager } from "../commands/CommandManager";
import { GridConfig } from "../config/GridConfig";
import type{ GridState } from "../state/GridState";
import { IdleState } from "../state/IdleState";

export class Grid {
    private container: HTMLElement;
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    
    private renderer: GridRenderer;
    private dataStore: GridDataStore;
    private viewport: Viewport;
    private selection: Selection;
    private editor: Editor;
    private commandManager: CommandManager;
    private summaryCalculator: Summary;

    private width: number;
    private height: number;

    // State Pattern Engine Context Integration
    private currentState: GridState;

    constructor(container: HTMLElement) {
        this.container = container;

        this.canvas = document.createElement("canvas");
        this.canvas.tabIndex = 0;
        this.canvas.style.outline = "none";
        this.canvas.style.touchAction = "none"; // Hard rule: disables native browser touch gestures for seamless Pointer Events
        this.container.appendChild(this.canvas);

        const ctx = this.canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas Context Not Supported");
        this.context = ctx;

        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.dataStore = new GridDataStore();
        this.viewport = new Viewport();
        this.viewport.setScroll(0, 0, this.dataStore, this.width, this.height);

        this.selection = new Selection();
        this.commandManager = new CommandManager();
        this.summaryCalculator = new Summary(this.dataStore);

        this.editor = new Editor(this.container, this.dataStore, this.commandManager, () => { this.render(); });
        this.renderer = new GridRenderer(this.context, this.dataStore, this.viewport, this.selection);
        this.currentState = new IdleState();

    }



    //State Pattern Context Transition
    public changeState(newState: GridState): void {
        this.currentState = newState;
    }

    //raw getters so Handlers can compute their own geometry freely
    public getDataStore(): GridDataStore { return this.dataStore; }
    public getViewport(): Viewport { return this.viewport; }
    public getSelection(): Selection { return this.selection; }
    public getEditor(): Editor { return this.editor; }
    public getCommandManager(): CommandManager { return this.commandManager; }
    public getCanvas(): HTMLCanvasElement { return this.canvas; }
    public getWidth(): number { return this.width; }
    public getHeight(): number { return this.height; }


    public render(): void {
        this.renderer.render(this.width, this.height);
        this.updateSummary();
    }

    public init(): void {
        this.registerEvents();
        this.render();
    }


    private updateSummary(): void {
        const currentRange = this.selection.getRange();
        
        // Protect calculation loops by .MAX_SAFE_INTEGER bounds
        const safeStartRow = Math.max(0, Math.min(currentRange.start.row, currentRange.end.row));
        let safeEndRow = Math.max(currentRange.start.row, currentRange.end.row);
        if (safeEndRow === Number.MAX_SAFE_INTEGER) {
            safeEndRow = GridConfig.TOTAL_ROWS - 1;
        }

        const safeStartCol = Math.max(0, Math.min(currentRange.start.column, currentRange.end.column));
        let safeEndCol = Math.max(currentRange.start.column, currentRange.end.column);
        if (safeEndCol === Number.MAX_SAFE_INTEGER) {
            safeEndCol = GridConfig.TOTAL_COLUMNS - 1;
        }

        const totalCells = (safeEndRow - safeStartRow + 1) * (safeEndCol - safeStartCol + 1);
        const summaryElement = document.querySelector(".summary-bar");
        
        if (!summaryElement) return;
        
        if (totalCells > 100000) {
            summaryElement.innerHTML = "<span>Selection too large to calculate summary.</span>";
            return;
        }
        const summaryData = this.summaryCalculator.calculate({
            start: { row: safeStartRow, column: safeStartCol },
            end: { row: safeEndRow, column: safeEndCol }
        });

        if (summaryElement) {
            summaryElement.innerHTML = `
                <span><strong>Count:</strong> ${summaryData.count}</span>
                <span><strong>Sum:</strong> ${summaryData.sum}</span>
                <span><strong>Avg:</strong> ${summaryData.average.toFixed(2)}</span>
                <span><strong>Avg:</strong> ${summaryData.average.toFixed(2)}</span>
                <span><strong>Min:</strong> ${summaryData.min === Number.MAX_VALUE ? 0 : summaryData.min}</span>
                <span><strong>Max:</strong> ${summaryData.max === Number.MIN_VALUE ? 0 : summaryData.max}</span>
                `;
        }
    }
        

    private registerEvents(): void {
        this.canvas.addEventListener("pointerdown", (e) => this.currentState.onPointerDown(this, e));
        this.canvas.addEventListener("pointermove", (e) => this.currentState.onPointerMove(this, e));
        this.canvas.addEventListener("pointerup", (e) => this.currentState.onPointerUp(this, e));
        this.canvas.addEventListener("dblclick", this.handleDoubleClick);
        this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
        this.canvas.addEventListener("keydown", this.handleKeyDown);
        window.addEventListener("resize", this.handleResize);
    }


    private handleDoubleClick = (event: MouseEvent): void => {
        if (event.offsetX < GridConfig.HEADER_WIDTH || event.offsetY < GridConfig.HEADER_HEIGHT) return;

        const cell = this.selection.getActiveCell();
        
        let targetX = GridConfig.HEADER_WIDTH - this.viewport.getScrollX();
        for (let c = 0; c < cell.column; c++) targetX += this.dataStore.getColumn(c).width;
        
        let targetY = GridConfig.HEADER_HEIGHT - this.viewport.getScrollY();
        for (let r = 0; r < cell.row; r++) targetY += this.dataStore.getRow(r).height;

        const w = this.dataStore.getColumn(cell.column).width;
        const h = this.dataStore.getRow(cell.row).height;

        this.editor.show(cell.row, cell.column, targetX, targetY, w, h);
    };

    private handleKeyDown = (event: KeyboardEvent): void => {
        // Keyboard Undo shortcut mapping (Ctrl + y nd Z)
        if (event.ctrlKey && event.key.toLowerCase() === 'z') { this.commandManager.undo(); this.render(); return; }
        if (event.ctrlKey && event.key.toLowerCase() === 'y') { this.commandManager.redo(); this.render(); return; }

        // Active Focus Cell Arrow Keys Controls Loops
        const active = this.selection.getActiveCell();
        let nextRow = active.row, nextCol = active.column, handleKey = false;

        if (event.key === "ArrowUp") { nextRow = Math.max(0, active.row - 1); handleKey = true; }
        else if (event.key === "ArrowDown") { nextRow = Math.min(GridConfig.TOTAL_ROWS - 1, active.row + 1); handleKey = true; }
        else if (event.key === "ArrowLeft") { nextCol = Math.max(0, active.column - 1); handleKey = true; }
        else if (event.key === "ArrowRight") { nextCol = Math.min(GridConfig.TOTAL_COLUMNS - 1, active.column + 1); handleKey = true; }

        if (handleKey) {
            event.preventDefault();
            this.selection.setActiveCell(nextRow, nextCol);
            
            // Inline Visibility Calculation to keep it independent
            let cLeft = 0; for (let c = 0; c < nextCol; c++) cLeft += this.dataStore.getColumn(c).width;
            let cRight = cLeft + this.dataStore.getColumn(nextCol).width;
            let rTop = 0; for (let r = 0; r < nextRow; r++) rTop += this.dataStore.getRow(r).height;
            let rBottom = rTop + this.dataStore.getRow(nextRow).height;

            let scrX = this.viewport.getScrollX(), scrY = this.viewport.getScrollY();
            if (cLeft < scrX) scrX = cLeft; else if (cRight > scrX + (this.width - GridConfig.HEADER_WIDTH)) scrX = cRight - (this.width - GridConfig.HEADER_WIDTH);
            if (rTop < scrY) scrY = rTop; else if (rBottom > scrY + (this.height - GridConfig.HEADER_HEIGHT - GridConfig.SUMMARY_HEIGHT)) scrY = rBottom - (this.height - GridConfig.HEADER_HEIGHT - GridConfig.SUMMARY_HEIGHT);

            this.viewport.setScroll(scrX, scrY, this.dataStore, this.width, this.height);

            this.render();
        }
    };



    private handleWheel = (event: WheelEvent): void => {
        event.preventDefault();
        const nextX = this.viewport.getScrollX() + event.deltaX;
        const nextY = this.viewport.getScrollY() + event.deltaY;
        this.viewport.setScroll(nextX, nextY, this.dataStore, this.width, this.height);
        this.render();
    };

    

    private handleResize = (): void => {
        this.width = this.container.clientWidth || window.innerWidth;
        this.height = this.container.clientHeight || window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.render();
    };

}