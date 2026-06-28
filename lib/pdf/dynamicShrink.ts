import {
    PDFField,
    PDFTextField,
    PDFDocument,
    PDFFont,
  } from "pdf-lib";

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
// Analyze a single field
// ---------------------------------------------------------

function analyzeTextField(field: PDFTextField): FieldMeta | null {
  const rawName = field.getName();
  const name = rawName ?? "";
  const normalizedName = normalize(name);

  const acro = field.acroField;
  const widgets = acro.getWidgets();
  if (!widgets || widgets.length === 0) return null;

  const rect = widgets[0].getRectangle();
  if (!rect) return null;

  const width = rect.width;
  const height = rect.height;

  /**
   * Detect multi-line safely without using "any".
   * pdf-lib does not expose getMultiline() in its types,
   * but some PDFs include it in the underlying AcroForm object.
   */
  const acroWithMultiline = acro as unknown as {
    getMultiline?: () => boolean;
  };

  const multilineFlag =
    typeof acroWithMultiline.getMultiline === "function"
      ? acroWithMultiline.getMultiline()
      : height > 30; // heuristic fallback

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
    width,
    height,
    multiline: multilineFlag,
    kind,
  };
}

// ---------------------------------------------------------
// Analyze all fields in a form
// ---------------------------------------------------------

export function analyzeFields(
  fields: PDFField[]
): Record<string, FieldMeta> {
  const metaByName: Record<string, FieldMeta> = {};

  for (const field of fields) {
    if (!(field instanceof PDFTextField)) continue;

    const meta = analyzeTextField(field);
    if (!meta) continue;

    const existing = metaByName[meta.normalizedName];

    if (!existing) {
      metaByName[meta.normalizedName] = meta;
    } else {
      // Keep the most restrictive geometry
      metaByName[meta.normalizedName] = {
        ...meta,
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
      return {
        mode: "chars",
        minFont: 4,
        maxFont: 12,
        sharedLayout: false,
      };

    case "multi":
      return {
        mode: "words",
        minFont: 9,
        maxFont: 12,
        sharedLayout: true,
      };

    case "single":
    default:
      return {
        mode: "words",
        minFont: 6,
        maxFont: 12,
        sharedLayout: false,
      };
  }
}

// ---------------------------------------------------------
// Geometry-based tuning
// ---------------------------------------------------------

function tuneRuleForGeometry(meta: FieldMeta, rule: ShrinkRule): ShrinkRule {
  const { width, height, kind } = meta;

  if (!width || !height) return rule;

  const aspect = width / height;

  // Extremely narrow numeric fields (Broward folio)
  if (kind === "numeric" && aspect < 6) {
    return {
      ...rule,
      minFont: Math.max(3.5, rule.minFont - 1),
    };
  }

  // Very tall multi-line fields (legal description)
  if (kind === "multi" && height > 40) {
    return {
      ...rule,
      minFont: Math.min(11, rule.minFont + 1),
    };
  }

  // Short single-line fields (NOC desc_of_improv)
  if (kind === "single" && height < 18) {
    return {
      ...rule,
      minFont: Math.max(7, rule.minFont + 1),
    };
  }

  // Very wide single-line fields (addresses)
  if (kind === "single" && aspect > 10) {
    return {
      ...rule,
      minFont: Math.max(6, rule.minFont),
    };
  }

  return rule;
}

// ---------------------------------------------------------
// Name-based tuning (minimal, only when geometry isn't enough)
// ---------------------------------------------------------

function tweakRuleForName(meta: FieldMeta, rule: ShrinkRule): ShrinkRule {
  const n = meta.normalizedName;

  // Description of improvement should stay readable
  if (n === "desc_of_improv" || n === "desc_of_improvement") {
    return {
      ...rule,
      minFont: Math.max(rule.minFont, 8),
      sharedLayout: false,
    };
  }

  // Legal description is multi-line and important
  if (n === "legal_description") {
    return {
      ...rule,
      minFont: Math.max(rule.minFont, 9),
      sharedLayout: true,
    };
  }

  // City fields often overflow
  if (n === "customer_address_city" || n === "company_address_city") {
    return {
      ...rule,
      minFont: Math.min(rule.minFont, 6),
    };
  }

  // Full address fields
  if (n === "customer_address_full" || n === "company_address_full") {
    return {
      ...rule,
      minFont: Math.min(rule.minFont, 6),
    };
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
// Character-based wrapping (for numeric fields)
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
// Apply layout to a PDFTextField
// ---------------------------------------------------------

export async function applyLayoutToField(
  field: PDFTextField,
  text: string,
  pdfDoc: PDFDocument,
  baseFont: PDFFont,
  rule: ShrinkRule
) {
  const acro = field.acroField;

  // Ensure default appearance exists
  if (!acro.getDefaultAppearance()) {
    acro.setDefaultAppearance(`/Helv 0 Tf 0 g`);
  }

  const widgets = acro.getWidgets();
  if (!widgets || widgets.length === 0) {
    field.setText(text);
    return;
  }

  const rect = widgets[0].getRectangle();
  if (!rect) {
    field.setText(text);
    return;
  }

  const padding = 4;
  const fieldWidth = rect.width - padding;
  const fieldHeight = rect.height - padding;

  const layout = computeLayoutWithRule(
    text,
    fieldWidth,
    fieldHeight,
    baseFont,
    rule
  );

  field.setFontSize(layout.fontSize);
  field.updateAppearances(baseFont);
  field.setText(layout.lines.join("\n"));
}
/**
 * Apply dynamic shrink logic to a field using:
 * - FieldMeta (from Part 1)
 * - ShrinkRule (from Part 2)
 * - Layout Engine (from Part 3)
 *
 * This is the single function your fillPdf.ts will call.
 */

export async function applyDynamicShrink(
  field: PDFTextField,
  text: string,
  pdfDoc: PDFDocument,
  baseFont: PDFFont,
  meta: FieldMeta,
  sharedLayoutCache: Map<string, TextLayout>
) {
  const rule = getShrinkRule(meta);

  const acro = field.acroField;
  if (!acro.getDefaultAppearance()) {
    acro.setDefaultAppearance(`/Helv 0 Tf 0 g`);
  }

  const widgets = acro.getWidgets();
  if (!widgets || widgets.length === 0) {
    field.setText(text);
    return;
  }

  const rect = widgets[0].getRectangle();
  if (!rect) {
    field.setText(text);
    return;
  }

  const padding = 4;
  const fieldWidth = rect.width - padding;
  const fieldHeight = rect.height - padding;

  // ---------------------------------------------------------
  // Shared layout logic (multi-line fields)
  // ---------------------------------------------------------
  let layout: TextLayout;

  if (rule.sharedLayout) {
    // If we already computed layout for this field name, reuse it
    if (sharedLayoutCache.has(meta.normalizedName)) {
      layout = sharedLayoutCache.get(meta.normalizedName)!;
    } else {
      // Compute layout using the *smallest* geometry across fields
      layout = computeLayoutWithRule(
        text,
        meta.width - padding,
        meta.height - padding,
        baseFont,
        rule
      );
      sharedLayoutCache.set(meta.normalizedName, layout);
    }
  } else {
    // Per-field layout
    layout = computeLayoutWithRule(
      text,
      fieldWidth,
      fieldHeight,
      baseFont,
      rule
    );
  }

  // ---------------------------------------------------------
  // Apply layout to field
  // ---------------------------------------------------------
  field.setFontSize(layout.fontSize);
  field.updateAppearances(baseFont);
  field.setText(layout.lines.join("\n"));
}

/**
 * Convenience helper for fillPdf.ts:
 *
 * Given:
 * - pdfDoc
 * - baseFont
 * - fieldMetaMap (from analyzeFields)
 *
 * Returns a function you can call for each field:
 *
 *    shrinker(field, value)
 */
export function createShrinker(
  pdfDoc: PDFDocument,
  baseFont: PDFFont,
  fieldMetaMap: Record<string, FieldMeta>
) {
  const sharedLayoutCache = new Map<string, TextLayout>();

  return async (field: PDFTextField, value: string) => {
    const name = field.getName();
    const normalized = name ? name.replace(/\s+/g, "").trim().toLowerCase() : "";

    const meta = fieldMetaMap[normalized];
    if (!meta) {
      // Fallback: treat as single-line text
      const fallbackRule: ShrinkRule = {
        mode: "words",
        minFont: 6,
        maxFont: 12,
        sharedLayout: false,
      };

      const acro = field.acroField;
      if (!acro.getDefaultAppearance()) {
        acro.setDefaultAppearance(`/Helv 0 Tf 0 g`);
      }

      const widgets = acro.getWidgets();
      if (!widgets || widgets.length === 0) {
        field.setText(value);
        return;
      }

      const rect = widgets[0].getRectangle();
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
      field.updateAppearances(baseFont);
      field.setText(layout.lines.join("\n"));
      return;
    }

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