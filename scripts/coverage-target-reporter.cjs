"use strict";
/**
 * Custom Vitest coverage reporter: prints target % and "need X more" after the summary.
 * Pass { target: COVERAGE_TARGET_PCT } from vite.config.ts so this default is not used.
 */
const { ReportBase } = require("istanbul-lib-report");

const DEFAULT_COVERAGE_TARGET_PCT = 70;
const METRICS = ["statements", "branches", "functions", "lines"];

function needToReach(targetPct, total) {
  return Math.ceil((targetPct / 100) * total);
}

class CoverageTargetReporter extends ReportBase {
  constructor(opts = {}) {
    super();
    this.target =
      typeof opts.target === "number"
        ? opts.target
        : DEFAULT_COVERAGE_TARGET_PCT;
  }

  onStart(node, context) {
    const summary = node.getCoverageSummary();
    const cw = context.writer.writeFile(this.file || null);
    cw.println("");
    cw.println(
      "Target: " +
        this.target +
        "% (see coverage.thresholds in vite.config.ts; uncomment to enforce)",
    );
    for (const key of METRICS) {
      const m = summary[key];
      if (!m || m.total === 0) continue;
      const need = needToReach(this.target, m.total);
      const more = Math.max(0, need - m.covered);
      const label = key.charAt(0).toUpperCase() + key.slice(1);
      const pad =
        label.length < 10 ? label + " ".repeat(10 - label.length) : label;
      const line =
        "  " +
        pad +
        ": " +
        m.pct +
        "% ( " +
        m.covered +
        "/" +
        m.total +
        " ) out of " +
        this.target +
        "%" +
        (more > 0 ? " — need " + more + " more" : "");
      cw.println(
        cw.colorize
          ? cw.colorize(line, context.classForPercent(key, m.pct))
          : line,
      );
    }
    cw.close();
  }
}

module.exports = CoverageTargetReporter;
