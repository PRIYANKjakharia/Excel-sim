# Excel Grid

## Overview

Excel Grid is an Excel-like spreadsheet application built using **TypeScript**, **HTML5 Canvas**, and **CSS**. The project focuses on rendering and interacting with large datasets efficiently while following object-oriented design principles. Instead of creating DOM elements for every cell, the grid uses a virtual rendering approach where only the visible portion of the grid is drawn on the canvas.

The application supports editing, row and column resizing, range selection, summary calculations, and undo/redo using the Command Pattern.

---

# Features

- Virtual rendering using HTML5 Canvas
- 100,000 rows × 500 columns support
- 50,000 generated JSON records
- Cell editing
- Row selection
- Column selection
- Range selection
- Select entire grid
- Row resizing
- Column resizing
- Summary calculations
  - Count
  - Sum
  - Averageb
  - Minimum
  - Maximum
- Undo / Redo
- Keyboard navigation
- Responsive viewport rendering

---

# Technologies Used

- TypeScript
- HTML5 Canvas
- CSS
- Vite

---

# Installation

Clone the repository

```bash
git clone https://github.com/PRIYANKjakharia/Excel-sim.git
```

Install dependencies

```bash
npm install
```

Run the project

```bash
npm run dev
```

Open the URL displayed by Vite in your browser.

---

# Project Structure

```
src
│
├── commands
├── config
├── data
├── grid
├── model
├── utils
└── main.ts
```

---

# Class Diagram

<img width="1024" height="1536" alt="Media" src="https://github.com/user-attachments/assets/ab68c221-4409-4d26-bf8f-9b6561ee7881" />


---

# Major Class Responsibilities

### Grid

Acts as the main coordinator of the application. It initializes all major components, registers user events, manages rendering, and connects the data layer with rendering and interaction.

### GridRenderer

Responsible only for drawing the spreadsheet on the HTML5 Canvas, including cells, grid lines, headers, active cell, selections, and resize indicators.

### GridDataStore

Stores rows, columns, and edited cells. Provides methods to retrieve and update cell data efficiently.

### Row & Column

Represent metadata for individual rows and columns such as height, width, and index.

### Cell

Represents a single edited cell and stores its row, column, and value.

### Viewport

Maintains the current scroll position and determines which rows and columns are visible on screen.

### Selection

Maintains the active cell and the currently selected range, row, or column.

### Editor

Displays an HTML input overlay for editing cells and updates the data model after editing.

### Summary

Calculates Count, Sum, Average, Minimum, and Maximum for numeric values in the selected range.

### CommandManager

Maintains undo and redo stacks and executes commands.

### Commands

- EditCommand
- ResizeColumnCommand
- ResizeRowCommand

Each command implements a common interface and supports execution and undo operations.

### JsonLoader

Generates and loads sample employee records into the grid.

---

# Data Storage

The application uses a sparse data model.

- Rows are stored separately.
- Columns are stored separately.
- Cell values are stored using a Map.

```
Map<"row-column", Cell>
```

Only edited or populated cells occupy memory, avoiding allocation for all 50 million cells.

---

# Virtual Rendering

Rendering the complete dataset would require drawing 50 million cells, which is impractical.

Instead, the viewport calculates the visible rows and columns based on the current scroll position. During rendering, only the visible portion of the grid is drawn on the canvas.

This significantly reduces rendering time and memory usage while allowing smooth scrolling.

---

# Command Pattern

Undo and redo functionality is implemented using the Command Pattern.

Each user action is encapsulated as a command implementing:

```
execute()
undo()
```

Current command implementations include:

- Cell Editing
- Row Resize
- Column Resize

The CommandManager maintains separate Undo and Redo stacks.

---

# OOP Concepts Used

### Encapsulation

Each class manages its own state and exposes only the required functionality.

### Abstraction

Rendering, editing, data storage, viewport management, and command execution are separated into dedicated classes.

### Inheritance

Command classes share a common ICommand interface.

### Polymorphism

The CommandManager interacts with all commands through the ICommand interface without depending on specific implementations.

---

# SOLID Principles

### Single Responsibility Principle

Each class has a dedicated responsibility.

Examples:

- GridRenderer handles rendering.
- Summary performs calculations.
- Editor manages editing.
- Viewport handles scrolling.
- GridDataStore stores data.

---

# Undo / Redo Workflow

1. User performs an action.
2. A command object is created.
3. CommandManager executes the command.
4. The command is pushed onto the Undo stack.
5. Undo restores the previous state.
6. Redo reapplies the stored command.

---

# Keyboard Controls

| Action | Key |
|---------|-----|
| Move Active Cell | Arrow Keys |
| Edit Cell | Double Click / Enter |
| Save Edit | Enter |
| Cancel Edit | Escape |
| Undo | Ctrl + Z |
| Redo | Ctrl + Y |

---

# Mouse Controls

| Action | Operation |
|---------|-----------|
| Select Cell | Click |
| Select Range | Drag |
| Select Row | Click Row Header |
| Select Column | Click Column Header |
| Select Entire Grid | Click Top-left Header |
| Resize Column | Drag Column Border |
| Resize Row | Drag Row Border |

---

# Performance Observations

- Supports 100,000 rows and 500 columns.
- Loads 50,000 generated JSON records.
- Virtual rendering prevents unnecessary drawing.
- Sparse storage reduces memory usage.
- Canvas rendering minimizes DOM overhead.
- Summary calculations are skipped for extremely large selections to avoid unnecessary processing.

---

# Accessibility Considerations

- HTML5 Canvas is not inherently accessible.
- Cell editing uses an HTML input overlay.
- Keyboard navigation is supported.
- Summary values are displayed outside the canvas as HTML elements.
- Visible focus is maintained for keyboard interaction.

---

# Test Scenarios Covered

- Cell editing
- Editing empty cells
- Editing numeric cells
- Undo editing
- Redo editing
- Row resize
- Column resize
- Undo row resize
- Undo column resize
- Row selection
- Column selection
- Range selection
- Select entire sheet
- Summary for numeric cells
- Summary for mixed values
- Empty cell handling
- Large dataset rendering
- Horizontal scrolling
- Vertical scrolling
- Keyboard navigation

---

# Known Limitations

- Formula support is not implemented.
- Copy/Paste functionality is not available.
- Cell formatting is not supported.
- Clipboard integration is not implemented.
- Search and filtering are not implemented.
- Large summary calculations are intentionally skipped to avoid performance degradation.

---

# Future Improvements

- Formula engine
- Clipboard support
- Copy / Paste
- CSV import/export
- Cell formatting
- Search and filtering
- Freeze panes
- Multi-sheet support
