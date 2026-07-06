import { PDFField, PDFTextField, PDFDocument, PDFFont } from "pdf-lib";

// ---------------------------------------------------------
// Types
// ---------------------------------------------------------
export type FieldKind = "numeric" | "multi" | "single";

export interface FieldMeta {
  name: string;
  normalizedName: string;
  width: number;
  height: number;
  multiline: boolean;
  kind: FieldKind;
}

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function normalize(name: string): string {
  return name.replace(/\s+/g, "").trim().toLowerCase();
}

function isNumericFieldName(name: string): boolean {
  const n = normalize(name);
  return (
    n.includes("folio") ||
    n.includes("tax") ||
    n.includes("id") ||
    n.includes("number") ||
    n.startsWith("customer_tax_folio")
  );
}

// ---------------------------------------------------------
// Analyze a single field (collect ALL widget geometries)
// ---------------------------------------------------------
function analyzeTextField(field: PDFTextField): FieldMeta | null {
  const rawName = field.getName();
  const name = rawName ?? "";
  const normalizedName = normalize(name);

  const acro = field.acroField;
  const widgets = acro.getWidgets();
  if (!widgets || widgets.length === 0) return null;

  // Start with very large values so Math.min works correctly
  let minWidth = Infinity;
  let minHeight = Infinity;

  // Detect multiline if ANY widget is multiline
  let multilineFlag = false;

  for (const w of widgets) {
    const rect = w.getRectangle();
    if (!rect) continue;

    minWidth = Math.min(minWidth, rect.width);
    minHeight = Math.min(minHeight, rect.height);

    const acroWithMultiline = acro as unknown as { getMultiline?: () => boolean };
    if (typeof acroWithMultiline.getMultiline === "function") {
      if (acroWithMultiline.getMultiline()) {
        multilineFlag = true;
      }
    } else {
      // heuristic fallback
      if (rect.height > 30) multilineFlag = true;
    }
  }

  // Determine field kind
  let kind: FieldKind;
  if (isNumericFieldName(name)) {
    kind = "numeric";
  } else if (multilineFlag) {
    kind = "multi";
  } else {
    kind = "single";
  }

  return {
    name,
    normalizedName,
    width: minWidth,
    height: minHeight,
    multiline: multilineFlag,
    kind,
  };
}

// ---------------------------------------------------------
// Analyze all fields in a form (merge ALL widgets per name)
// ---------------------------------------------------------
export function analyzeFields(fields: PDFField[]): Record<string, FieldMeta> {
  const metaByName: Record<string, FieldMeta> = {};

  for (const field of fields) {
    if (!(field instanceof PDFTextField)) continue;

    const meta = analyzeTextField(field);
    if (!meta) continue;

    const existing = metaByName[meta.normalizedName];

    if (!existing) {
      // First time seeing this field name
      metaByName[meta.normalizedName] = meta;
    } else {
      // Merge geometry: always take the smallest width/height across ALL widgets
      metaByName[meta.normalizedName] = {
        ...existing,
        width: Math.min(existing.width, meta.width),
        height: Math.min(existing.height, meta.height),
        multiline: existing.multiline || meta.multiline,
        kind: existing.kind === "numeric" ? "numeric" : meta.kind,
      };
    }
  }

  return metaByName;
}

// ---------------------------------------------------------
// Shrink Rule Types
// ---------------------------------------------------------
export type ShrinkMode = "words" | "chars";

export interface ShrinkRule {
  mode: ShrinkMode;
  minFont: number;
  maxFont: number;
  sharedLayout: boolean;
}

// ---------------------------------------------------------
// Base rules per field kind
// ---------------------------------------------------------
function baseRuleForKind(kind: FieldKind): ShrinkRule {
  switch (kind) {
    case "numeric":
      return { mode: "chars", minFont: 4, maxFont: 12, sharedLayout: true };
    case "multi":
      return { mode: "words", minFont: 9, maxFont: 12, sharedLayout: true };
    case "single":
    default:
      return { mode: "words", minFont: 6, maxFont: 12, sharedLayout: true };
  }
}

// ---------------------------------------------------------
// Geometry-based tuning
// ---------------------------------------------------------
function tuneRuleForGeometry(meta: FieldMeta, rule: ShrinkRule): ShrinkRule {
  const { width, height, kind } = meta;
  if (!width || !height) return rule;

  const aspect = width / height;

  if (kind === "numeric" && aspect < 6) {
    return { ...rule, minFont: Math.max(3.5, rule.minFont - 1) };
  }

  if (kind === "multi" && height > 40) {
    return { ...rule, minFont: Math.min(11, rule.minFont + 1) };
  }

  if (kind === "single" && height < 18) {
    return { ...rule, minFont: Math.max(7, rule.minFont + 1) };
  }

  if (kind === "single" && aspect > 10) {
    return { ...rule, minFont: Math.max(6, rule.minFont) };
  }

  return rule;
}

// ---------------------------------------------------------
// Name-based tuning
// ---------------------------------------------------------
function tweakRuleForName(meta: FieldMeta, rule: ShrinkRule): ShrinkRule {
  const n = meta.normalizedName;

  if (n === "desc_of_improv" || n === "desc_of_improvement") {
    return { ...rule, minFont: Math.max(rule.minFont, 8), sharedLayout: true };
  }

  if (n === "legal_description") {
    return { ...rule, minFont: Math.max(rule.minFont, 9), sharedLayout: true };
  }

  if (
    n === "customer_address_city" ||
    n === "company_address_city" ||
    n === "customer_address_full" ||
    n === "company_address_full"
  ) {
    return { ...rule, minFont: Math.min(rule.minFont, 6), sharedLayout: true };
  }

  return rule;
}

// ---------------------------------------------------------
// Public API: get shrink rule for a field
// ---------------------------------------------------------
export function getShrinkRule(meta: FieldMeta): ShrinkRule {
  const base = baseRuleForKind(meta.kind);
  const tuned = tuneRuleForGeometry(meta, base);
  const finalRule = tweakRuleForName(meta, tuned);
  return finalRule;
}

// ---------------------------------------------------------
// TextLayout type
// ---------------------------------------------------------
export interface TextLayout {
  fontSize: number;
  lines: string[];
}

// ---------------------------------------------------------
// Word-based wrapping
// ---------------------------------------------------------
function wrapByWords(
  text: string,
  size: number,
  fieldWidth: number,
  baseFont: PDFFont
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? current + " " + word : word;
    const width = baseFont.widthOfTextAtSize(test, size);

    if (width > fieldWidth) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------
// Character-based wrapping
// ---------------------------------------------------------
function wrapByChars(
  text: string,
  size: number,
  fieldWidth: number,
  baseFont: PDFFont
): string[] {
  const lines: string[] = [];
  let current = "";

  for (const ch of text) {
    const test = current + ch;
    const width = baseFont.widthOfTextAtSize(test, size);

    if (width > fieldWidth) {
      if (current) lines.push(current);
      current = ch;
    } else {
      current = test;
    }
  }

  if (current) lines.push(current);
  return lines;
}

// ---------------------------------------------------------
// Compute layout using a ShrinkRule
// ---------------------------------------------------------
export function computeLayoutWithRule(
  text: string,
  fieldWidth: number,
  fieldHeight: number,
  baseFont: PDFFont,
  rule: ShrinkRule
): TextLayout {
  if (!text) {
    return { fontSize: rule.maxFont, lines: [""] };
  }

  let fontSize = rule.maxFont;
  let finalLines: string[] = [];

  while (fontSize >= rule.minFont) {
    const lines =
      rule.mode === "chars"
        ? wrapByChars(text, fontSize, fieldWidth, baseFont)
        : wrapByWords(text, fontSize, fieldWidth, baseFont);

    const totalHeight = lines.length * (fontSize * 1.2);

    if (totalHeight <= fieldHeight) {
      finalLines = lines;
      break;
    }

    fontSize -= 0.5;
  }

  if (finalLines.length === 0) {
    const lines =
      rule.mode === "chars"
        ? wrapByChars(text, rule.minFont, fieldWidth, baseFont)
        : wrapByWords(text, rule.minFont, fieldWidth, baseFont);

    finalLines = lines;
    fontSize = rule.minFont;
  }

  return { fontSize, lines: finalLines };
}
// ---------------------------------------------------------
// Apply dynamic shrink
// ---------------------------------------------------------
export async function applyDynamicShrink(
  field: PDFTextField,
  text: string,
  pdfDoc: PDFDocument,
  baseFont: PDFFont,
  meta: FieldMeta,
  sharedLayoutCache: Map<string, TextLayout>
) {
  // ============================================================
  // DEBUG: Field identity + meta
  // ============================================================
  const name = field.getName();
  const normalized = name ? name.replace(/\s+/g, "").trim().toLowerCase() : "";

  console.log("=== APPLY SHRINK ===");
  console.log("Field Name:", name);
  console.log("Normalized:", normalized);
  console.log("Meta:", meta);
  console.log("Value:", text);

  const rule = getShrinkRule(meta);
  const acro = field.acroField;

  if (!acro.getDefaultAppearance()) {
    acro.setDefaultAppearance(`/Helv 0 Tf 0 g`);
  }

  const widgets = acro.getWidgets();
  if (!widgets || widgets.length === 0) {
    console.log("NO WIDGETS FOUND — setting text directly");
    field.setText(text);
    console.log("=== END SHRINK ===");
    return;
  }

  const padding = 4;
  let layout: TextLayout;

  // ============================================================
  // Shared layout for all fields with same normalized name
  // (meta.width/height are already the smallest across pages)
  // ============================================================
  if (sharedLayoutCache.has(meta.normalizedName)) {
    console.log("Using cached layout for:", meta.normalizedName);
    layout = sharedLayoutCache.get(meta.normalizedName)!;
  } else {
    console.log("Computing NEW layout:");
    console.log("  meta.width:", meta.width);
    console.log("  meta.height:", meta.height);

    layout = computeLayoutWithRule(
      text,
      meta.width - padding,
      meta.height - padding,
      baseFont,
      rule
    );

    sharedLayoutCache.set(meta.normalizedName, layout);
  }

  // ============================================================
  // Apply layout (pdf-lib will propagate to widgets via appearances)
  // ============================================================
  console.log("Final Font Size:", layout.fontSize);
  console.log("Final Lines:", layout.lines);
  console.log("=== END SHRINK ===");

  field.setFontSize(layout.fontSize);
  field.setText(layout.lines.join("\n"));
  field.updateAppearances(baseFont);
}

// ---------------------------------------------------------
// Create shrinker for fillPdf.ts
// ---------------------------------------------------------
export function createShrinker(
  pdfDoc: PDFDocument,
  baseFont: PDFFont,
  fieldMetaMap: Record<string, FieldMeta>
) {
  const sharedLayoutCache = new Map<string, TextLayout>();

  return async (field: PDFTextField, value: string) => {
    const name = field.getName();
    const normalized = name
      ? name.replace(/\s+/g, "").trim().toLowerCase()
      : "";

    const meta = fieldMetaMap[normalized];

    console.log("=== SHRINK DEBUG ===");
    console.log("Field Name:", name);
    console.log("Normalized:", normalized);

    if (meta) {
      console.log("META FOUND:");
      console.log("  meta.width:", meta.width);
      console.log("  meta.height:", meta.height);
      console.log("  meta.multiline:", meta.multiline);
    } else {
      console.log("NO META FOUND — FALLBACK MODE");
    }

    const acro = field.acroField;
    const widgets = acro.getWidgets();

    if (widgets && widgets.length > 0) {
      const rect = widgets[0].getRectangle();
      console.log("Widget Rect:");
      console.log("  rect.width:", rect.width);
      console.log("  rect.height:", rect.height);
    } else {
      console.log("NO WIDGETS FOUND");
    }

    console.log("Value:", value);
    console.log("====================");

    // ---------------------------------------------------------
    // FALLBACK (no meta found)
    // ---------------------------------------------------------
    if (!meta) {
      const fallbackRule: ShrinkRule = {
        mode: "words",
        minFont: 6,
        maxFont: 12,
        sharedLayout: true,
      };

      if (!acro.getDefaultAppearance()) {
        acro.setDefaultAppearance(`/Helv 0 Tf 0 g`);
      }

      const fallbackWidgets = acro.getWidgets();
      if (!fallbackWidgets || fallbackWidgets.length === 0) {
        field.setText(value);
        return;
      }

      const rect = fallbackWidgets[0].getRectangle();
      const padding = 4;

      const fieldWidth = rect.width - padding;
      const fieldHeight = rect.height - padding;

      const layout = computeLayoutWithRule(
        value,
        fieldWidth,
        fieldHeight,
        baseFont,
        fallbackRule
      );

      field.setFontSize(layout.fontSize);
      field.setText(layout.lines.join("\n"));
      field.updateAppearances(baseFont);
      return;
    }

    // ---------------------------------------------------------
    // MAIN SHRINK PATH (meta exists)
    // ---------------------------------------------------------
    await applyDynamicShrink(
      field,
      value,
      pdfDoc,
      baseFont,
      meta,
      sharedLayoutCache
    );
  };
}