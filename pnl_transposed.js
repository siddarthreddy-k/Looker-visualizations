looker.plugins.visualizations.add({
  id: "pnl_transposed",
  label: "P&L Transposed Table",
  options: {
    positive_color: {
      type: "string",
      label: "Positive Value Color",
      display: "color",
      default: "#1a7f4b"
    },
    negative_color: {
      type: "string",
      label: "Negative Value Color",
      display: "color",
      default: "#c0392b"
    },
    header_bg: {
      type: "string",
      label: "Header Background Color",
      display: "color",
      default: "#1e2a3a"
    }
  },

  create: function(element, config) {
    element.style.fontFamily = "'Inter', 'Helvetica Neue', Arial, sans-serif";
    element.style.fontSize = "13px";
    element.style.overflowX = "auto";
    element.style.overflowY = "auto";
    element.style.height = "100%";
    element.style.width = "100%";
    element.innerHTML = '<div id="pnl-wrap"></div>';

    // Inject styles
    var style = document.createElement("style");
    style.innerHTML = `
      #pnl-wrap { width: 100%; height: 100%; overflow: auto; }
      .pnl-table { border-collapse: collapse; width: 100%; min-width: 600px; }
      .pnl-table th {
        background: #1e2a3a;
        color: #ffffff;
        padding: 8px 12px;
        text-align: right;
        font-weight: 600;
        font-size: 12px;
        white-space: nowrap;
        border: 1px solid #2c3e50;
        position: sticky;
        top: 0;
        z-index: 2;
      }
      .pnl-table th.metric-header {
        text-align: left;
        min-width: 200px;
        position: sticky;
        left: 0;
        z-index: 3;
        background: #1e2a3a;
      }
      .pnl-table td {
        padding: 7px 12px;
        text-align: right;
        border: 1px solid #e8ecef;
        white-space: nowrap;
        font-size: 12px;
      }
      .pnl-table td.metric-name {
        text-align: left;
        font-weight: 500;
        background: #f8f9fa;
        position: sticky;
        left: 0;
        z-index: 1;
        border-right: 2px solid #dee2e6;
        min-width: 200px;
        color: #2c3e50;
      }
      .pnl-table tr:hover td { background: #f0f4f8; }
      .pnl-table tr:hover td.metric-name { background: #e8edf2; }
      .pnl-table tr.section-divider td {
        border-top: 2px solid #adb5bd;
      }
      .pnl-table tr.subtotal td {
        background: #edf2f7;
        font-weight: 600;
      }
      .pnl-table tr.subtotal td.metric-name {
        background: #dde6ef;
      }
      .pnl-table tr.percent-row td {
        color: #555;
        font-style: italic;
        font-size: 11px;
        background: #fafbfc;
      }
      .pnl-table tr.percent-row td.metric-name {
        background: #f0f2f5;
        padding-left: 24px;
      }
      .val-positive { color: #1a7f4b; }
      .val-negative { color: #c0392b; }
      .val-neutral  { color: #2c3e50; }
    `;
    element.appendChild(style);
  },

  updateAsync: function(data, element, config, queryResponse, details, done) {
    // Clear previous errors
    this.clearErrors();

    var wrap = document.getElementById("pnl-wrap");
    if (!wrap) { done(); return; }

    // ----- Validate we have pivoted data -----
    var pivots = queryResponse.pivots;
    if (!pivots || pivots.length === 0) {
      this.addError({
        title: "No Pivot Detected",
        message: "Please pivot on Calendar Month in the Explore before using this visualization."
      });
      done();
      return;
    }

    // ----- Field ordering: define P&L row order -----
    var FIELD_ORDER = [
      { key: "fact_costs__omnichannel_pnl_allocated.units_sold",              label: "Units Sold",                    type: "units" },
      { key: "fact_costs__omnichannel_pnl_allocated.gross_sales",             label: "Gross Sales",                   type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.shipping_giftwrap_charges",label: "Shipping & Giftwrap",          type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.return_value",            label: "Return Value",                  type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.aggregated_vat",          label: "Aggregated VAT",                type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.promotions",              label: "Promotions",                    type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.net_revenue",             label: "Net Revenue",                   type: "money",  divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.product_cost",            label: "Product Cost",                  type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.redemption_coupon_fees",  label: "Redemption / Coupon Fees",      type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm1",                     label: "CM1",                           type: "money",  divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM1_percent",             label: "CM1 %",                         type: "pct",    indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.fulfillment_fees",        label: "Fulfillment Fees",              type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_fulfilment_fees",   label: "Other Fulfilment Fees",         type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.referral_fees",           label: "Referral Fees",                 type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_referral_fees",     label: "Other Referral Fees",           type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_sales_channel_fees",label: "Other Sales Channel Fees",      type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm2",                     label: "CM2",                           type: "money",  divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM2_percent",             label: "CM2 %",                         type: "pct",    indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_ads_cost",  label: "Sales Channel Ads Cost",        type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.off_sales_channel_ads_cost", label: "Off-Channel Ads Cost",       type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.other_advertising_fees",  label: "Other Advertising Fees",        type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.facebook_ads_cost",       label: "Facebook Ads Cost",             type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.google_ads_cost",         label: "Google Ads Cost",               type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.uncaught_sales_channel_fees", label: "Uncaught SC Fees",          type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.cm3",                     label: "CM3",                           type: "money",  divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.CM3_percent",             label: "CM3 %",                         type: "pct",    indent: true },
      { key: "fact_costs__omnichannel_pnl_allocated.inventory_adjustment",    label: "Inventory Adjustment",          type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.professional_fees",       label: "Professional Fees",             type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_freight",   label: "SC Freight",                    type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_other_w_d", label: "SC Other W&D",                  type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_storage",   label: "SC Storage",                    type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.sales_channel_transport", label: "SC Transport",                  type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_inbound",         label: "3PL Inbound",                   type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_storage",         label: "3PL Storage",                   type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_outbound",        label: "3PL Outbound",                  type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.threepl_transport",       label: "3PL Transport",                 type: "money" },
      { key: "fact_costs__omnichannel_pnl_allocated.ecm4",                    label: "ECM4",                          type: "money",  divider: true, subtotal: true },
      { key: "fact_costs__omnichannel_pnl_allocated.ECM4_percent",            label: "ECM4 %",                        type: "pct",    indent: true },
    ];

    // ----- Extract pivot month labels (sorted ascending) -----
    var months = pivots.map(function(p) {
      return { key: p.key, label: p.data["dim_dates.calendar_month"] || p.key };
    });
    // Sort months ascending (oldest first, like Tableau)
    months.sort(function(a, b) { return a.key < b.key ? -1 : 1; });

    // ----- Build value lookup: { fieldKey: { pivotKey: value } } -----
    // data[0] contains all pivoted measures in one row
    var row = data[0] || {};
    var lookup = {};
    FIELD_ORDER.forEach(function(field) {
      lookup[field.key] = {};
      months.forEach(function(m) {
        var cell = row[field.key + "_" + m.key] || row[field.key];
        // Looker pivot cell format: row["fieldName"]["pivotKey"].value
        if (row[field.key] && row[field.key][m.key] !== undefined) {
          var cellVal = row[field.key][m.key];
          lookup[field.key][m.key] = (cellVal && cellVal.value !== undefined) ? cellVal.value : null;
        } else {
          lookup[field.key][m.key] = null;
        }
      });
    });

    // ----- Format helpers -----
    function fmt(val, type) {
      if (val === null || val === undefined) return "—";
      var num = parseFloat(val);
      if (isNaN(num)) return "—";
      if (type === "pct") {
        return (num * 100).toFixed(1) + "%";
      }
      if (type === "units") {
        return Math.round(num).toLocaleString();
      }
      // money
      var abs = Math.abs(num);
      var formatted;
      if (abs >= 1000000) {
        formatted = (num / 1000000).toFixed(2) + "M";
      } else if (abs >= 1000) {
        formatted = (num / 1000).toFixed(1) + "K";
      } else {
        formatted = num.toFixed(2);
      }
      return formatted;
    }

    function colorClass(val, type) {
      if (val === null || val === undefined) return "val-neutral";
      var num = parseFloat(val);
      if (isNaN(num)) return "val-neutral";
      if (type === "pct") return num >= 0 ? "val-positive" : "val-negative";
      return num >= 0 ? "val-positive" : "val-negative";
    }

    // ----- Build HTML table -----
    var html = '<table class="pnl-table"><thead><tr>';
    html += '<th class="metric-header">Metric</th>';
    months.forEach(function(m) {
      html += '<th>' + m.label + '</th>';
    });
    html += '</tr></thead><tbody>';

    FIELD_ORDER.forEach(function(field) {
      var rowClass = "";
      if (field.subtotal) rowClass += " subtotal";
      if (field.divider) rowClass += " section-divider";
      if (field.type === "pct") rowClass += " percent-row";

      html += '<tr class="' + rowClass.trim() + '">';
      var nameStyle = field.indent ? ' style="padding-left:24px;"' : '';
      html += '<td class="metric-name"' + nameStyle + '>' + field.label + '</td>';

      months.forEach(function(m) {
        var val = (lookup[field.key] || {})[m.key];
        var display = fmt(val, field.type);
        var cls = colorClass(val, field.type);
        html += '<td class="' + cls + '">' + display + '</td>';
      });

      html += '</tr>';
    });

    html += '</tbody></table>';
    wrap.innerHTML = html;

    done();
  }
});