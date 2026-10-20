looker.plugins.visualizations.add({
  id: "pnl_transposed",
  label: "P&L Transposed Table",

  create: function(element, config) {
    element.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
    element.style.fontSize = "13px";
    element.style.overflow = "auto";
    element.style.height = "100%";
    element.style.width = "100%";

    var style = document.createElement("style");
    style.textContent = [
      "#pnl-wrap { width:100%; height:100%; overflow:auto; }",
      ".pnl-table { border-collapse:collapse; width:100%; min-width:600px; }",
      ".pnl-table th { background:#1e2a3a; color:#fff; padding:8px 12px; text-align:right; font-weight:600; font-size:12px; white-space:nowrap; border:1px solid #2c3e50; position:sticky; top:0; z-index:2; }",
      ".pnl-table th.metric-header { text-align:left; min-width:200px; position:sticky; left:0; z-index:3; background:#1e2a3a; }",
      ".pnl-table td { padding:7px 12px; text-align:right; border:1px solid #e8ecef; white-space:nowrap; font-size:12px; }",
      ".pnl-table td.metric-name { text-align:left; font-weight:500; background:#f8f9fa; position:sticky; left:0; z-index:1; border-right:2px solid #dee2e6; min-width:200px; color:#2c3e50; }",
      ".pnl-table tr:hover td { background:#f0f4f8; }",
      ".pnl-table tr:hover td.metric-name { background:#e8edf2; }",
      ".pnl-table tr.section-divider td { border-top:2px solid #adb5bd; }",
      ".pnl-table tr.subtotal td { background:#edf2f7; font-weight:600; }",
      ".pnl-table tr.subtotal td.metric-name { background:#dde6ef; }",
      ".pnl-table tr.percent-row td { color:#555; font-style:italic; font-size:11px; background:#fafbfc; }",
      ".pnl-table tr.percent-row td.metric-name { background:#f0f2f5; padding-left:24px; }",
      ".val-positive { color:#1a7f4b; }",
      ".val-negative { color:#c0392b; }",
      ".val-neutral  { color:#2c3e50; }"
    ].join(" ");
    element.appendChild(style);

    var wrap = document.createElement("div");
    wrap.id = "pnl-wrap";
    element.appendChild(wrap);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    this.clearErrors();

    var wrap = element.querySelector("#pnl-wrap");
    if (!wrap) { done(); return; }

    // Clear previous content using DOM
    while (wrap.firstChild) { wrap.removeChild(wrap.firstChild); }

    var pivots = queryResponse.pivots;
    if (!pivots || pivots.length === 0) {
      var msg = document.createElement("p");
      msg.textContent = "Please pivot on Calendar Month in the Explore.";
      msg.style.cssText = "padding:20px; color:#c0392b; font-weight:bold;";
      wrap.appendChild(msg);
      done();
      return;
    }

    var FIELD_ORDER = [
      { key: "fact_costs__omnichannel_pnl_allocated.units_sold",               label: "Units Sold",                 type: "units" },
      { key: "fact_costs__omnichannel_pnl_allocated.gross_sales",              label: "Gross Sales",                type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.shipping_giftwrap_charges",label: "Shipping & Giftwrap",        type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.return_value",             label: "Return Value",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.aggregated_vat",           label: "Aggregated VAT",             type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.promotions",               label: "Promotions",                 type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.net_revenue",              label: "Net Revenue",                type: "money", divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.product_cost",             label: "Product Cost",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.redemption_coupon_fees",   label: "Redemption / Coupon Fees",   type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm1",                      label: "CM1",                        type: "money", divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM1_percent",              label: "CM1 %",                      type: "pct",   indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.fulfillment_fees",         label: "Fulfillment Fees",           type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_fulfilment_fees",    label: "Other Fulfilment Fees",      type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.referral_fees",            label: "Referral Fees",              type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_referral_fees",      label: "Other Referral Fees",        type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_sales_channel_fees", label: "Other Sales Channel Fees",   type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm2",                      label: "CM2",                        type: "money", divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM2_percent",              label: "CM2 %",                      type: "pct",   indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_ads_cost",   label: "Sales Channel Ads Cost",     type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.off_sales_channel_ads_cost",label: "Off-Channel Ads Cost",      type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_advertising_fees",   label: "Other Advertising Fees",     type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.facebook_ads_cost",        label: "Facebook Ads Cost",          type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.google_ads_cost",          label: "Google Ads Cost",            type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.uncaught_sales_channel_fees",label: "Uncaught SC Fees",         type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm3",                      label: "CM3",                        type: "money", divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM3_percent",              label: "CM3 %",                      type: "pct",   indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.inventory_adjustment",     label: "Inventory Adjustment",       type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.professional_fees",        label: "Professional Fees",          type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_freight",    label: "SC Freight",                 type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_other_w_d",  label: "SC Other W&D",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_storage",    label: "SC Storage",                 type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_transport",  label: "SC Transport",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_inbound",          label: "3PL Inbound",                type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_storage",          label: "3PL Storage",                type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_outbound",         label: "3PL Outbound",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_transport",        label: "3PL Transport",              type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.ecm4",                     label: "ECM4",                       type: "money", divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.ECM4_percent",             label: "ECM4 %",                     type: "pct",   indent: true },
    ];

    // Sort months ascending
    var months = pivots.slice().sort(function(a, b) {
      return a.key < b.key ? -1 : 1;
    });

    // Build value lookup from all data rows (aggregated across months)
    // Each row in data corresponds to one pivot combination
    // With month pivoted, data[0] holds all months for that dimension combination
    var row = data[0] || {};

    function getVal(fieldKey, pivotKey) {
      var cell = row[fieldKey];
      if (!cell) return null;
      // Pivoted: cell is an object keyed by pivot key
      if (typeof cell === "object" && cell[pivotKey] !== undefined) {
        var v = cell[pivotKey];
        if (v && typeof v === "object" && v.value !== undefined) return v.value;
        return v;
      }
      // Not pivoted fallback
      if (cell.value !== undefined) return cell.value;
      return null;
    }

    function fmt(val, type) {
      if (val === null || val === undefined) return "—";
      var num = parseFloat(val);
      if (isNaN(num)) return "—";
      if (type === "pct") return (num * 100).toFixed(1) + "%";
      if (type === "units") return Math.round(num).toLocaleString();
      var abs = Math.abs(num);
      if (abs >= 1000000) return (num / 1000000).toFixed(2) + "M";
      if (abs >= 1000) return (num / 1000).toFixed(1) + "K";
      return num.toFixed(2);
    }

    // Build table using DOM
    var table = document.createElement("table");
    table.className = "pnl-table";

    // Header row
    var thead = document.createElement("thead");
    var headerRow = document.createElement("tr");
    var th0 = document.createElement("th");
    th0.className = "metric-header";
    th0.textContent = "Metric";
    headerRow.appendChild(th0);
    months.forEach(function(m) {
      var th = document.createElement("th");
      th.textContent = m.key; // e.g. "2026-09"
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body rows
    var tbody = document.createElement("tbody");
    FIELD_ORDER.forEach(function(field) {
      var tr = document.createElement("tr");
      var classes = [];
      if (field.subtotal) classes.push("subtotal");
      if (field.divider) classes.push("section-divider");
      if (field.type === "pct") classes.push("percent-row");
      if (classes.length) tr.className = classes.join(" ");

      // Metric name cell
      var tdName = document.createElement("td");
      tdName.className = "metric-name";
      if (field.indent) tdName.style.paddingLeft = "24px";
      tdName.textContent = field.label;
      tr.appendChild(tdName);

      // Value cells per month
      months.forEach(function(m) {
        var val = getVal(field.key, m.key);
        var td = document.createElement("td");
        td.textContent = fmt(val, field.type);
        if (val !== null && val !== undefined) {
          var num = parseFloat(val);
          if (!isNaN(num)) {
            td.className = num >= 0 ? "val-positive" : "val-negative";
          }
        }
        tr.appendChild(td);
      });

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    wrap.appendChild(table);

    done();
  }
});
