looker.plugins.visualizations.add({
  id: "pnl_transposed",
  label: "P&L Transposed Table",

  create: function(element, config) {
    element.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
    element.style.fontSize = "13px";
    element.style.overflow = "auto";
    element.style.height = "100%";
    element.style.width = "100%";
    element.innerHTML = '<div id="pnl-wrap"></div>';

    var style = document.createElement("style");
    style.innerHTML = `
      #pnl-wrap { width: 100%; height: 100%; overflow: auto; }
      .pnl-table { border-collapse: collapse; width: 100%; min-width: 600px; }
      .pnl-table th {
        background: #1e2a3a; color: #fff; padding: 8px 12px;
        text-align: right; font-weight: 600; font-size: 12px;
        white-space: nowrap; border: 1px solid #2c3e50;
        position: sticky; top: 0; z-index: 2;
      }
      .pnl-table th.metric-header {
        text-align: left; min-width: 200px;
        position: sticky; left: 0; z-index: 3; background: #1e2a3a;
      }
      .pnl-table td {
        padding: 7px 12px; text-align: right;
        border: 1px solid #e8ecef; white-space: nowrap; font-size: 12px;
      }
      .pnl-table td.metric-name {
        text-align: left; font-weight: 500; background: #f8f9fa;
        position: sticky; left: 0; z-index: 1;
        border-right: 2px solid #dee2e6; min-width: 200px; color: #2c3e50;
      }
      .pnl-table tr:hover td { background: #f0f4f8; }
      .pnl-table tr:hover td.metric-name { background: #e8edf2; }
      .pnl-table tr.section-divider td { border-top: 2px solid #adb5bd; }
      .pnl-table tr.subtotal td { background: #edf2f7; font-weight: 600; }
      .pnl-table tr.subtotal td.metric-name { background: #dde6ef; }
      .pnl-table tr.percent-row td { color: #555; font-style: italic; font-size: 11px; background: #fafbfc; }
      .pnl-table tr.percent-row td.metric-name { background: #f0f2f5; padding-left: 24px; }
      .val-positive { color: #1a7f4b; }
      .val-negative { color: #c0392b; }
      .val-neutral  { color: #2c3e50; }
      .debug-box { background: #fff3cd; padding: 12px; font-size: 11px; font-family: monospace; white-space: pre-wrap; word-break: break-all; }
    `;
    element.appendChild(style);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();
    var wrap = document.getElementById("pnl-wrap");
    if (!wrap) { done(); return; }

    // ---- DEBUG: dump raw structure so we can see exactly what Looker sends ----
    var debug = {
      pivots: queryResponse.pivots,
      fields_measures: (queryResponse.fields.measures || []).map(function(f){ return f.name; }),
      data_row0_keys: data[0] ? Object.keys(data[0]) : [],
      data_row0_sample: data[0] ? JSON.stringify(data[0]).substring(0, 2000) : "no data"
    };
    wrap.innerHTML = '<div class="debug-box">' + JSON.stringify(debug, null, 2) + '</div>';
    done();
  }
});
