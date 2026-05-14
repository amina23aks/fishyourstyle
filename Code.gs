const ORDERS_HEADERS = [
  "rowKey",
  "orderId",
  "createdAt",
  "month",
  "date",
  "status",
  "customerName",
  "customerEmail",
  "phone",
  "wilaya",
  "address",
  "deliveryMode",
  "itemsCount",
  "itemsSummary",
  "subtotal",
  "shippingFee",
  "discount",
  "total",
  "paymentMethod",
  "costOfGoodsSold",
  "netProfit",
  "profitSnapshotComplete",
];

const ORDER_ITEMS_HEADERS = [
  "rowKey",
  "orderId",
  "createdAt",
  "date",
  "status",
  "wilaya",
  "deliveryMode",
  "itemName",
  "itemQty",
  "itemUnitPrice",
  "itemTotal",
  "paymentMethod",
  "category",
  "design",
  "itemCostPrice",
  "itemProfit",
  "itemProfitTotal",
];

function syncNow() {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty("ADMIN_EXPORT_TOKEN");
  if (!token) {
    throw new Error("Missing ADMIN_EXPORT_TOKEN in Script Properties.");
  }

  const since = props.getProperty("LAST_SINCE");
  let url = "https://fishyourstyle.vercel.app/api/admin/orders-export?max=200";
  if (since) {
    url += `&since=${encodeURIComponent(since)}`;
  }

  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    muteHttpExceptions: false,
  });

  const payload = JSON.parse(response.getContentText());
  const orders = Array.isArray(payload.orders) ? payload.orders : [];
  const orderItems = Array.isArray(payload.orderItems) ? payload.orderItems : [];
  const nextSince = payload.nextSince || since || new Date(0).toISOString();

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const ordersSheet = getOrCreateSheet(spreadsheet, "Orders", ORDERS_HEADERS);
  const orderItemsSheet = getOrCreateSheet(spreadsheet, "OrderItems", ORDER_ITEMS_HEADERS);

  const ordersAppended = appendNewRows(ordersSheet, ORDERS_HEADERS, orders);
  const orderItemsAppended = appendNewRows(orderItemsSheet, ORDER_ITEMS_HEADERS, orderItems);

  props.setProperty("LAST_SINCE", nextSince);

  Logger.log("Orders appended: %s", ordersAppended);
  Logger.log("OrderItems appended: %s", orderItemsAppended);
  Logger.log("Updated LAST_SINCE: %s", nextSince);
}

function installHourlyTrigger() {
  ScriptApp.newTrigger("syncNow").timeBased().everyHours(1).create();
}

function resetCursor() {
  PropertiesService.getScriptProperties().deleteProperty("LAST_SINCE");
}

function getOrCreateSheet(spreadsheet, name, headers) {
  const sheet = spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  const headerCell = sheet.getRange(1, 1, 1, 1).getValue();
  if (!headerCell) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  return sheet;
}

function appendNewRows(sheet, headers, rows) {
  const existingKeys = new Set();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    const keyValues = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    keyValues.forEach((row) => {
      const key = row[0];
      if (key !== "" && key !== null && typeof key !== "undefined") {
        existingKeys.add(String(key));
      }
    });
  }

  const newRows = [];
  rows.forEach((row) => {
    const key = row.rowKey != null ? String(row.rowKey) : "";
    if (!key || existingKeys.has(key)) {
      return;
    }
    existingKeys.add(key);
    newRows.push(headers.map((header) => row[header]));
  });

  if (newRows.length > 0) {
    sheet
      .getRange(sheet.getLastRow() + 1, 1, newRows.length, headers.length)
      .setValues(newRows);
  }

  return newRows.length;
}
