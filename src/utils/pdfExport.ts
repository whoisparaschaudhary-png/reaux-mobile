import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatCurrency, formatDate } from './formatters';
import type { SalesReport, User, Product, Order, DietPlan, Meal, MealItem, Workout, Exercise } from '../types/models';

/**
 * Export sales report as PDF
 */
export const exportSalesReportPDF = async (salesReport: SalesReport) => {
  const currentDate = formatDate(new Date().toISOString());

  const monthlyRows = salesReport.monthlyBreakdown?.map((month) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${month.month}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${month.orders}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right; font-weight: 600;">${formatCurrency(month.revenue)}</td>
    </tr>
  `).join('') || '<tr><td colspan="3" style="text-align: center; padding: 20px; color: #999;">No monthly data available</td></tr>';

  const productRows = salesReport.topProducts?.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">#${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${item.product?.name || 'Product'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${item.totalSold || 0}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right; font-weight: 600; color: #22c55e;">${formatCurrency(item.revenue || 0)}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align: center; padding: 20px; color: #999;">No product data available</td></tr>';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #f9f506;
            margin-bottom: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1c1c0d;
            margin-bottom: 4px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .revenue-card {
            background: #1c1c0d;
            color: #ffffff;
            text-align: center;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 40px;
          }
          .revenue-label {
            font-size: 14px;
            opacity: 0.7;
            margin-bottom: 8px;
          }
          .revenue-value {
            font-size: 36px;
            font-weight: 700;
            color: #f9f506;
          }
          .section {
            margin-bottom: 40px;
          }
          .section-title {
            font-size: 20px;
            font-weight: 600;
            margin-bottom: 20px;
            color: #1c1c0d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #f8f8f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 14px;
            color: #1c1c0d;
            border-bottom: 2px solid #e4e4e4;
          }
          td {
            font-size: 14px;
            color: #1c1c0d;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Sales Report</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="revenue-card">
          <div class="revenue-label">Total Revenue</div>
          <div class="revenue-value">${formatCurrency(salesReport.totalRevenue || 0)}</div>
        </div>

        <div class="section">
          <div class="section-title">Monthly Breakdown</div>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th style="text-align: center;">Orders</th>
                <th style="text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${monthlyRows}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Top Performing Products</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 60px;">Rank</th>
                <th>Product</th>
                <th style="text-align: center;">Sold</th>
                <th style="text-align: right;">Revenue</th>
              </tr>
            </thead>
            <tbody>
              ${productRows}
            </tbody>
          </table>
        </div>

        <div class="footer">
          <p>REAUX Labs - Fitness & Wellness Platform</p>
          <p>This report is confidential and intended for internal use only.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export users list as PDF
 */
export const exportUsersListPDF = async (users: User[]) => {
  const currentDate = formatDate(new Date().toISOString());

  const userRows = users.map((user, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${user.name || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${user.email || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${user.phone || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
        <span style="
          background: ${user.role === 'superadmin' ? '#ef4444' : user.role === 'admin' ? '#f59e0b' : '#3b82f6'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        ">${user.role || 'user'}</span>
      </td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
        <span style="
          background: ${user.status === 'active' ? '#22c55e' : '#ef4444'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        ">${user.status || 'active'}</span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #f9f506;
            margin-bottom: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1c1c0d;
            margin-bottom: 4px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 40px;
          }
          .stat-card {
            background: #f8f8f5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            min-width: 150px;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1c1c0d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #f8f8f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: #1c1c0d;
            border-bottom: 2px solid #e4e4e4;
          }
          td {
            font-size: 13px;
            color: #1c1c0d;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Users Report</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Users</div>
            <div class="stat-value">${users.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Users</div>
            <div class="stat-value">${users.filter(u => u.status === 'active').length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Admins</div>
            <div class="stat-value">${users.filter(u => u.role === 'admin' || u.role === 'superadmin').length}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 50px;">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style="text-align: center; width: 100px;">Role</th>
              <th style="text-align: center; width: 100px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${userRows}
          </tbody>
        </table>

        <div class="footer">
          <p>REAUX Labs - Fitness & Wellness Platform</p>
          <p>This report is confidential and intended for internal use only.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export products list as PDF
 */
export const exportProductsListPDF = async (products: Product[]) => {
  const currentDate = formatDate(new Date().toISOString());

  const productRows = products.map((product, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${product.name || 'N/A'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${product.category || 'Uncategorized'}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right; font-weight: 600;">${formatCurrency(product.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${product.stock}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
        <span style="
          background: ${product.isActive ? '#22c55e' : '#ef4444'};
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        ">${product.isActive ? 'Active' : 'Hidden'}</span>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #f9f506;
            margin-bottom: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1c1c0d;
            margin-bottom: 4px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 40px;
          }
          .stat-card {
            background: #f8f8f5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            min-width: 150px;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1c1c0d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #f8f8f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 12px;
            color: #1c1c0d;
            border-bottom: 2px solid #e4e4e4;
          }
          td {
            font-size: 13px;
            color: #1c1c0d;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Products Report</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Products</div>
            <div class="stat-value">${products.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Active Products</div>
            <div class="stat-value">${products.filter(p => p.isActive).length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Stock</div>
            <div class="stat-value">${products.reduce((sum, p) => sum + (p.stock || 0), 0)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 50px;">#</th>
              <th>Product Name</th>
              <th>Category</th>
              <th style="text-align: right;">Price</th>
              <th style="text-align: center; width: 80px;">Stock</th>
              <th style="text-align: center; width: 80px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${productRows}
          </tbody>
        </table>

        <div class="footer">
          <p>REAUX Labs - Fitness & Wellness Platform</p>
          <p>This report is confidential and intended for internal use only.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export orders list as PDF
 */
export const exportOrdersListPDF = async (orders: Order[]) => {
  const currentDate = formatDate(new Date().toISOString());

  const orderRows = orders.map((order, index) => {
    const customerName = typeof order.userId === 'object' && order.userId !== null
      ? order.userId.name || 'Unknown'
      : 'Customer';

    const statusColors: Record<string, string> = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      shipped: '#f9f506',
      delivered: '#22c55e',
      cancelled: '#ef4444',
    };

    return `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; font-weight: 600;">#${order._id.slice(-6).toUpperCase()}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${customerName}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${formatDate(order.createdAt)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${order.items.length}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right; font-weight: 600;">${formatCurrency(order.finalAmount)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
        <span style="
          background: ${statusColors[order.status] || '#999'};
          color: ${order.status === 'shipped' ? '#1c1c0d' : 'white'};
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        ">${order.status}</span>
      </td>
    </tr>
  `;
  }).join('');

  const totalRevenue = orders.reduce((sum, order) => sum + order.finalAmount, 0);
  const totalDiscount = orders.reduce((sum, order) => sum + (order.discount || 0), 0);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo {
            font-size: 32px;
            font-weight: 700;
            color: #f9f506;
            margin-bottom: 8px;
          }
          .title {
            font-size: 24px;
            font-weight: 600;
            color: #1c1c0d;
            margin-bottom: 4px;
          }
          .date {
            font-size: 14px;
            color: #666;
          }
          .stats {
            display: flex;
            gap: 20px;
            justify-content: center;
            margin-bottom: 40px;
          }
          .stat-card {
            background: #f8f8f5;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            min-width: 150px;
          }
          .stat-label {
            font-size: 12px;
            color: #666;
            margin-bottom: 8px;
          }
          .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #1c1c0d;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 8px;
            overflow: hidden;
          }
          th {
            background: #f8f8f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            color: #1c1c0d;
            border-bottom: 2px solid #e4e4e4;
          }
          td {
            font-size: 12px;
            color: #1c1c0d;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Orders Report</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="stats">
          <div class="stat-card">
            <div class="stat-label">Total Orders</div>
            <div class="stat-value">${orders.length}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Revenue</div>
            <div class="stat-value">${formatCurrency(totalRevenue)}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Total Discount</div>
            <div class="stat-value">${formatCurrency(totalDiscount)}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">#</th>
              <th style="width: 100px;">Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th style="text-align: center; width: 60px;">Items</th>
              <th style="text-align: right; width: 100px;">Amount</th>
              <th style="text-align: center; width: 90px;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${orderRows}
          </tbody>
        </table>

        <div class="footer">
          <p>REAUX Labs - Fitness & Wellness Platform</p>
          <p>This report is confidential and intended for internal use only.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export single order as PDF (invoice/receipt)
 */
export const exportSingleOrderPDF = async (order: Order) => {
  const customerName = typeof order.userId === 'object' && order.userId !== null
    ? order.userId.name || 'Unknown'
    : 'Customer';

  const itemRows = order.items.map((item, index) => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${index + 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4;">${item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e4e4e4; text-align: right; font-weight: 600;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  const statusColors: Record<string, string> = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    shipped: '#f9f506',
    delivered: '#22c55e',
    cancelled: '#ef4444',
  };

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo {
            font-size: 36px;
            font-weight: 700;
            color: #f9f506;
            margin-bottom: 8px;
          }
          .title {
            font-size: 28px;
            font-weight: 600;
            color: #1c1c0d;
            margin-bottom: 12px;
          }
          .order-id {
            font-size: 18px;
            font-weight: 600;
            color: #666;
            margin-bottom: 8px;
          }
          .status-badge {
            display: inline-block;
            background: ${statusColors[order.status] || '#999'};
            color: ${order.status === 'shipped' ? '#1c1c0d' : 'white'};
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            text-transform: capitalize;
          }
          .info-section {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            gap: 40px;
          }
          .info-box {
            flex: 1;
          }
          .info-label {
            font-size: 12px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          .info-text {
            font-size: 14px;
            color: #1c1c0d;
            line-height: 1.6;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            background: #ffffff;
            border: 1px solid #e4e4e4;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 30px;
          }
          th {
            background: #f8f8f5;
            padding: 12px;
            text-align: left;
            font-weight: 600;
            font-size: 13px;
            color: #1c1c0d;
            border-bottom: 2px solid #e4e4e4;
          }
          td {
            font-size: 14px;
            color: #1c1c0d;
          }
          .totals-section {
            text-align: right;
            margin-bottom: 40px;
          }
          .total-row {
            display: flex;
            justify-content: flex-end;
            gap: 40px;
            padding: 8px 0;
            font-size: 14px;
          }
          .total-label {
            color: #666;
            min-width: 120px;
          }
          .total-value {
            font-weight: 600;
            color: #1c1c0d;
            min-width: 100px;
            text-align: right;
          }
          .grand-total {
            border-top: 2px solid #e4e4e4;
            padding-top: 12px;
            margin-top: 12px;
          }
          .grand-total .total-label {
            font-size: 16px;
            font-weight: 600;
            color: #1c1c0d;
          }
          .grand-total .total-value {
            font-size: 20px;
            font-weight: 700;
            color: #f9f506;
          }
          .footer {
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            text-align: center;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Order Invoice</div>
          <div class="order-id">Order #${order._id.slice(-6).toUpperCase()}</div>
          <div style="margin-top: 12px;">
            <span class="status-badge">${order.status}</span>
          </div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <div class="info-label">Customer</div>
            <div class="info-text">${customerName}</div>
          </div>
          <div class="info-box">
            <div class="info-label">Order Date</div>
            <div class="info-text">${formatDate(order.createdAt)}</div>
          </div>
          ${order.shippingAddress ? `
          <div class="info-box">
            <div class="info-label">Shipping Address</div>
            <div class="info-text">
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
              ${order.shippingAddress.pincode}
              ${order.shippingAddress.phone ? `<br>Phone: ${order.shippingAddress.phone}` : ''}
            </div>
          </div>
          ` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 50px;">#</th>
              <th>Product</th>
              <th style="text-align: center; width: 80px;">Quantity</th>
              <th style="text-align: right; width: 100px;">Price</th>
              <th style="text-align: right; width: 120px;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <div class="total-label">Subtotal:</div>
            <div class="total-value">${formatCurrency(order.totalAmount)}</div>
          </div>
          ${order.discount > 0 ? `
          <div class="total-row">
            <div class="total-label">Discount ${order.promoCode ? `(${order.promoCode})` : ''}:</div>
            <div class="total-value" style="color: #22c55e;">-${formatCurrency(order.discount)}</div>
          </div>
          ` : ''}
          <div class="total-row grand-total">
            <div class="total-label">Total Amount:</div>
            <div class="total-value">${formatCurrency(order.finalAmount)}</div>
          </div>
        </div>

        <div class="footer">
          <p>REAUX Labs - Fitness & Wellness Platform</p>
          <p>Thank you for your order!</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export diet plan as PDF (for plans created by admin)
 */
export const exportDietPlanPDF = async (plan: DietPlan) => {
  const currentDate = formatDate(new Date().toISOString());
  const categoryLabel = plan.category ? String(plan.category).replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const mealSections = (plan.meals ?? []).map((meal) => {
    const itemsRows = (meal.items ?? []).map((item: MealItem) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4;">${escapeHtml(item.name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4;">${item.quantity || '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${item.calories ?? '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${item.protein ?? '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${item.carbs ?? '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: right;">${item.fat ?? '—'}</td>
      </tr>
    `).join('');
    return `
      <div class="section">
        <div class="section-title">${escapeHtml(meal.name)}${meal.time ? ` · ${meal.time}` : ''}</div>
        <table>
          <thead>
            <tr>
              <th>Food</th>
              <th>Qty</th>
              <th style="text-align: right;">Cal</th>
              <th style="text-align: right;">P (g)</th>
              <th style="text-align: right;">C (g)</th>
              <th style="text-align: right;">F (g)</th>
            </tr>
          </thead>
          <tbody>${itemsRows || '<tr><td colspan="6" style="padding: 12px; color: #999;">No items</td></tr>'}</tbody>
        </table>
      </div>
    `;
  }).join('');

  const tagsHtml = (plan.tags ?? []).length > 0
    ? `<p style="margin-top: 16px;"><strong>Tags:</strong> ${(plan.tags ?? []).map((t) => `#${escapeHtml(t)}`).join(', ')}</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1c1c0d; background: #fff; }
          .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #f9f506; }
          .logo { font-size: 24px; font-weight: 700; color: #1c1c0d; margin-bottom: 4px; }
          .title { font-size: 22px; font-weight: 600; color: #1c1c0d; margin-bottom: 8px; }
          .meta { font-size: 14px; color: #666; margin-bottom: 4px; }
          .date { font-size: 12px; color: #999; }
          .badge { display: inline-block; background: #f9f506; color: #1c1c0d; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
          .section { margin-bottom: 28px; }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1c1c0d; }
          .desc { font-size: 14px; line-height: 1.5; color: #444; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #e4e4e4; border-radius: 8px; overflow: hidden; }
          th { background: #f8f8f5; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #1c1c0d; border-bottom: 2px solid #e4e4e4; }
          td { font-size: 13px; color: #1c1c0d; }
          .calories-card { background: #1c1c0d; color: #fff; text-align: center; padding: 20px; border-radius: 12px; margin-bottom: 24px; }
          .calories-value { font-size: 28px; font-weight: 700; color: #f9f506; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e4e4; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">${escapeHtml(plan.title)}</div>
          ${categoryLabel ? `<span class="badge">${escapeHtml(categoryLabel)}</span>` : ''}
          <div class="date">Generated on ${currentDate}</div>
        </div>
        ${plan.description ? `<div class="desc">${escapeHtml(plan.description)}</div>` : ''}
        ${plan.totalCalories != null ? `<div class="calories-card"><div class="calories-value">${plan.totalCalories} cal</div><div>Total calories per day</div></div>` : ''}
        ${mealSections}
        ${tagsHtml}
        <div class="footer">REAUX Labs — Diet Plan. For personal use only.</div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export workout plan as PDF (for plans created by admin)
 */
export const exportWorkoutPlanPDF = async (workout: Workout) => {
  const currentDate = formatDate(new Date().toISOString());
  const categoryLabel = workout.category ? String(workout.category).replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  const difficultyLabel = workout.difficulty ? String(workout.difficulty).replace(/\b\w/g, (c) => c.toUpperCase()) : '';

  const exerciseRows = (workout.exercises ?? []).map((ex: Exercise, index: number) => {
    const details = [
      ex.sets != null ? `${ex.sets} sets` : null,
      ex.reps != null ? `${ex.reps} reps` : null,
      ex.weight != null ? `${ex.weight} kg` : null,
      ex.duration != null ? `${ex.duration}s` : null,
      ex.restTime != null ? `${ex.restTime}s rest` : null,
    ].filter(Boolean).join(' · ');
    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: center; font-weight: 600;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4;">${escapeHtml(ex.name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px; color: #666;">${escapeHtml(details || '—')}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px; color: #666;">${ex.notes ? escapeHtml(ex.notes) : '—'}</td>
      </tr>
    `;
  }).join('');

  const tagsHtml = (workout.tags ?? []).length > 0
    ? `<p style="margin-top: 16px;"><strong>Tags:</strong> ${(workout.tags ?? []).map((t) => `#${escapeHtml(t)}`).join(', ')}</p>`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1c1c0d; background: #fff; }
          .header { text-align: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 3px solid #f9f506; }
          .logo { font-size: 24px; font-weight: 700; color: #1c1c0d; margin-bottom: 4px; }
          .title { font-size: 22px; font-weight: 600; color: #1c1c0d; margin-bottom: 8px; }
          .meta { font-size: 14px; color: #666; }
          .date { font-size: 12px; color: #999; margin-top: 4px; }
          .badge { display: inline-block; background: #e4e4e4; color: #1c1c0d; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; margin: 4px 4px 0 0; }
          .stats { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 24px; }
          .stat { background: #f8f8f5; padding: 16px 20px; border-radius: 12px; min-width: 100px; text-align: center; }
          .stat-value { font-size: 20px; font-weight: 700; color: #1c1c0d; }
          .stat-label { font-size: 11px; color: #666; margin-top: 4px; }
          .section { margin-bottom: 28px; }
          .section-title { font-size: 18px; font-weight: 600; margin-bottom: 12px; color: #1c1c0d; }
          .desc { font-size: 14px; line-height: 1.5; color: #444; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; border: 1px solid #e4e4e4; border-radius: 8px; overflow: hidden; }
          th { background: #f8f8f5; padding: 10px 12px; text-align: left; font-weight: 600; font-size: 12px; color: #1c1c0d; border-bottom: 2px solid #e4e4e4; }
          td { font-size: 13px; color: #1c1c0d; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e4e4e4; text-align: center; font-size: 11px; color: #999; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">${escapeHtml(workout.title)}</div>
          <div class="meta">
            ${categoryLabel ? `<span class="badge">${escapeHtml(categoryLabel)}</span>` : ''}
            ${difficultyLabel ? `<span class="badge">${escapeHtml(difficultyLabel)}</span>` : ''}
          </div>
          <div class="date">Generated on ${currentDate}</div>
        </div>
        ${workout.description ? `<div class="desc">${escapeHtml(workout.description)}</div>` : ''}
        <div class="stats">
          <div class="stat"><div class="stat-value">${workout.duration}</div><div class="stat-label">min</div></div>
          ${workout.caloriesBurn != null ? `<div class="stat"><div class="stat-value">${workout.caloriesBurn}</div><div class="stat-label">cal</div></div>` : ''}
          <div class="stat"><div class="stat-value">${(workout.exercises ?? []).length}</div><div class="stat-label">exercises</div></div>
        </div>
        <div class="section">
          <div class="section-title">Exercises</div>
          <table>
            <thead>
              <tr>
                <th style="text-align: center; width: 48px;">#</th>
                <th>Exercise</th>
                <th>Details</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>${exerciseRows || '<tr><td colspan="4" style="padding: 12px; color: #999;">No exercises</td></tr>'}</tbody>
          </table>
        </div>
        ${tagsHtml}
        <div class="footer">REAUX Labs — Workout Plan. For personal use only.</div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

function escapeHtml(text: string): string {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Export all users as PDF
 */
export const exportUsersPDF = async (users: User[]) => {
  const currentDate = formatDate(new Date().toISOString());

  const userRows = users.map((user, index) => {
    const gymName = user.gymId && typeof user.gymId === 'object' ? (user.gymId as any).name : '—';
    const doj = user.dateOfJoining ? formatDate(user.dateOfJoining) : (user.createdAt ? formatDate(user.createdAt) : '—');
    const isActive = user.status === 'active';

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-weight: 500;">${escapeHtml(user.name)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px;">${escapeHtml(user.email)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px;">${user.phone || '—'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
          <span style="padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: ${user.role === 'superadmin' ? '#fee2e2' : user.role === 'admin' ? '#fef3c7' : '#f0f0f0'}; color: ${user.role === 'superadmin' ? '#ef4444' : user.role === 'admin' ? '#f59e0b' : '#666'};">${user.role}</span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px;">${gymName}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; font-size: 12px;">${doj}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e4e4e4; text-align: center;">
          <span style="color: ${isActive ? '#22c55e' : '#ef4444'}; font-weight: 600; font-size: 12px;">● ${isActive ? 'Active' : 'Disabled'}</span>
        </td>
      </tr>
    `;
  }).join('');

  const activeCount = users.filter(u => u.status === 'active').length;
  const disabledCount = users.length - activeCount;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            color: #1c1c0d;
            background: #ffffff;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #f9f506;
          }
          .logo { font-size: 32px; font-weight: 700; color: #f9f506; margin-bottom: 8px; }
          .title { font-size: 24px; font-weight: 600; color: #1c1c0d; margin-bottom: 4px; }
          .date { font-size: 14px; color: #666; }
          .summary-row {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
          }
          .summary-card {
            flex: 1;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            border: 1px solid #e4e4e4;
          }
          .summary-label { font-size: 13px; color: #666; margin-bottom: 4px; }
          .summary-value { font-size: 28px; font-weight: 700; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th {
            background: #1c1c0d;
            color: #ffffff;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          tr:nth-child(even) { background: #fafafa; }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e4e4e4;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">REAUX LABS</div>
          <div class="title">Members Report</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>

        <div class="summary-row">
          <div class="summary-card">
            <div class="summary-label">Total Members</div>
            <div class="summary-value" style="color: #1c1c0d;">${users.length}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Active</div>
            <div class="summary-value" style="color: #22c55e;">${activeCount}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Disabled</div>
            <div class="summary-value" style="color: #ef4444;">${disabledCount}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center;">#</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th style="text-align: center;">Role</th>
              <th>Gym</th>
              <th>Date of Joining</th>
              <th style="text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${userRows || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #999;">No users found</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          REAUX Labs · Members Report · ${currentDate}
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }
    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};

/**
 * Export generic data as PDF with custom HTML
 */
export const exportPDF = async (html: string, filename: string = 'export.pdf') => {
  try {
    const { uri } = await Print.printToFileAsync({ html });

    if (Platform.OS === 'ios') {
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } else {
      await Sharing.shareAsync(uri);
    }

    return true;
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('Failed to export PDF');
  }
};
