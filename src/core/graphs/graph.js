import { fmt } from "../format.js";

/**
 * A graph is a core view-model: it knows its label, series, how to read the
 * current value from a Strata metrics payload, and how to format a value.
 * It must not touch the DOM; the presentation layer renders it.
 */
export class Graph {
  constructor({ id, label, series, unit = "", max = null, dual = false }) {
    this.id = id;
    this.label = label;
    this.series = series;
    this.unit = unit;
    this.max = max;
    this.dual = dual;
    this.prefillSeries = null;
  }

  value(_data) {
    return null;
  }

  prefillValue(_data) {
    return null;
  }

  format(value) {
    return fmt(value, 0);
  }

  formatPrefill(value) {
    return fmt(value, 0);
  }

  unitFor(data, value) {
    return typeof this.unit === "function" ? this.unit(data, value) : this.unit;
  }

  display(data, value = this.value(data)) {
    if (value == null) return "\u2013";
    const unit = this.unitFor(data, value);
    if (!unit) return this.format(value);
    return `${this.format(value)}${unit === "%" ? "" : " "}${unit}`;
  }

  sub(_data) {
    return "";
  }

  sparkValues(data) {
    return data?.history?.[this.series] ?? [];
  }

  sparkMax(data) {
    return typeof this.max === "function" ? this.max(data) : this.max;
  }

  prefillValues(data) {
    return this.prefillSeries ? (data?.history?.[this.prefillSeries] ?? []) : [];
  }

  prefillMax(_data) {
    return null;
  }
}
