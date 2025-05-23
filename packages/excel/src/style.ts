import type * as Excel from "exceljs";

export class ExcelStyle {
  styleHeaderCell(cell: Excel.Cell) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffebebeb" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "-100000f" } },
      right: { style: "thin", color: { argb: "-100000f" } },
    };
    cell.font = {
      name: "Arial",
      size: 12,
      bold: true,
      color: { argb: "ff252525" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  }

  styleDataCell(cell: Excel.Cell) {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "ffffffff" },
    };
    cell.border = {
      bottom: { style: "thin", color: { argb: "-100000f" } },
      right: { style: "thin", color: { argb: "-100000f" } },
    };
    cell.font = {
      name: "Arial",
      size: 10,
      color: { argb: "ff252525" },
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
  }
}
