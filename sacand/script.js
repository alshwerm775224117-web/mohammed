/**
 * ============================================
 *  محاسبي برو – نظام الفوترة المتكامل
 *  جميع الوظائف محصورة في هذا الملف
 * ============================================
 */

(function() {
    "use strict";

    // ---------- تحميل البيانات ----------
    let company = JSON.parse(localStorage.getItem('company')) || {
        name: 'مؤسسة مخبز رقائق غوار للمعجنات',
        vat: '', reg: '', address: '', phone: '', email: '', logo: ''
    };
    let customers = JSON.parse(localStorage.getItem('customers')) || [];
    let items = JSON.parse(localStorage.getItem('items')) || [];
    let invoices = JSON.parse(localStorage.getItem('invoices')) || [];
    let receipts = JSON.parse(localStorage.getItem('receipts')) || [];

    // ---------- دوال مساعدة ----------
    function formatNum(n) { return Number(n).toFixed(2); }
    function generateId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
    function saveData() {
        localStorage.setItem('company', JSON.stringify(company));
        localStorage.setItem('customers', JSON.stringify(customers));
        localStorage.setItem('items', JSON.stringify(items));
        localStorage.setItem('invoices', JSON.stringify(invoices));
        localStorage.setItem('receipts', JSON.stringify(receipts));
        updateStats();
        updateBadges();
    }

    // ---------- تحديث الإحصائيات ----------
    function updateStats() {
        document.getElementById('statInvoices').textContent = invoices.length;
        document.getElementById('statCustomers').textContent = customers.length;
        document.getElementById('statItems').textContent = items.length;
        const total = invoices.reduce((sum, inv) => sum + inv.total, 0);
        document.getElementById('statRevenue').textContent = formatNum(total);

        // آخر الفواتير
        const recentInv = invoices.slice(-5).reverse();
        const div = document.getElementById('recentInvoices');
        if (recentInv.length === 0) {
            div.innerHTML = '<span class="text-gray-400">لا توجد فواتير بعد</span>';
        } else {
            div.innerHTML = recentInv.map(inv =>
                `<div class="flex justify-between py-1 border-b border-gray-100 text-sm">
                    <span>${inv.number}</span>
                    <span>${inv.customerName}</span>
                    <span class="font-bold">${formatNum(inv.total)} ر.س</span>
                </div>`
            ).join('');
        }

        // آخر سندات القبض
        const recentRec = receipts.slice(-5).reverse();
        const div2 = document.getElementById('recentReceipts');
        if (recentRec.length === 0) {
            div2.innerHTML = '<span class="text-gray-400">لا توجد سندات بعد</span>';
        } else {
            div2.innerHTML = recentRec.map(r => {
                const c = customers.find(c => c.id === r.customerId) || { name: 'غير معروف' };
                return `<div class="flex justify-between py-1 border-b border-gray-100 text-sm">
                        <span>${c.name}</span>
                        <span class="font-bold text-green-600">${formatNum(r.amount)} ر.س</span>
                    </div>`;
            }).join('');
        }
    }

    // ---------- تحديث البادجات (الأرقام) ----------
    function updateBadges() {
        document.getElementById('salesBadge').textContent = invoices.length;
        document.getElementById('customerBadge').textContent = customers.length;
        document.getElementById('itemBadge').textContent = items.length;
        document.getElementById('receiptBadge').textContent = receipts.length;
    }

    // ---------- تحديث رأس الشركة ----------
    function updateCompanyHeader() {
        const logoImg = document.getElementById('settingsLogoPreview');
        if (company.logo) { logoImg.src = company.logo; }
    }
    updateCompanyHeader();

    // ---------- ملء القوائم المنسدلة ----------
    function populateSelects() {
        const selects = ['invoiceCustomer', 'receiptCustomer', 'accountCustomer'];
        selects.forEach(id => {
            const sel = document.getElementById(id);
            if (!sel) return;
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- اختر --</option>';
            customers.forEach((c, idx) => {
                const opt = document.createElement('option');
                opt.value = idx;
                opt.textContent = c.name + (c.vat ? ` (${c.vat})` : '');
                sel.appendChild(opt);
            });
            if (currentVal && sel.querySelector(`option[value="${currentVal}"]`)) {
                sel.value = currentVal;
            }
        });
    }

    // ---------- عرض العملاء ----------
    function renderCustomerList() {
        const ul = document.getElementById('customerList');
        ul.innerHTML = '';
        customers.forEach((c, idx) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-gray-50 p-2 rounded-lg';
            li.innerHTML = `<span>${c.name} - ${c.vat || ''}</span>
                <button data-idx="${idx}" class="del-customer text-red-500">✖</button>`;
            ul.appendChild(li);
        });
        document.querySelectorAll('.del-customer').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                customers.splice(idx, 1);
                saveData();
                renderAll();
            });
        });
        populateSelects();
    }

    // ---------- عرض الأصناف ----------
    function renderItemsList() {
        const ul = document.getElementById('itemsList');
        ul.innerHTML = '';
        items.forEach((it, idx) => {
            const li = document.createElement('li');
            li.className = 'flex justify-between items-center bg-gray-50 p-2 rounded-lg';
            li.innerHTML = `<span>${it.name} - ${it.price} ر.س</span>
                <button data-idx="${idx}" class="del-item text-red-500">✖</button>`;
            ul.appendChild(li);
        });
        document.querySelectorAll('.del-item').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                items.splice(idx, 1);
                saveData();
                renderItemsList();
            });
        });
    }

    // ---------- إضافة صف صنف في الفاتورة ----------
    function addInvoiceRow(name = '', price = 0, qty = 1) {
        const tbody = document.getElementById('invoiceItemsBody');
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="text" class="inv-name w-full" value="${name}" placeholder="الوصف" /></td>
            <td><input type="number" class="inv-qty w-16" value="${qty}" min="0" /></td>
            <td><input type="number" class="inv-price w-20" value="${price}" min="0" step="0.01" /></td>
            <td class="inv-total text-center">0.00</td>
            <td><button class="remove-inv-row text-red-500">✖</button></td>
        `;
        tbody.appendChild(tr);
        const inputs = tr.querySelectorAll('input');
        inputs.forEach(inp => inp.addEventListener('input', updateInvoiceTotals));
        tr.querySelector('.remove-inv-row').addEventListener('click', function() {
            if (tbody.children.length > 1) { tr.remove(); updateInvoiceTotals(); }
            else { alert('يجب أن يبقى صنف واحد على الأقل.'); }
        });
        updateInvoiceTotals();
    }

    // ---------- تحديث إجماليات الفاتورة ----------
    function updateInvoiceTotals() {
        let net = 0;
        const rows = document.querySelectorAll('#invoiceItemsBody tr');
        rows.forEach(tr => {
            const qty = parseFloat(tr.querySelector('.inv-qty').value) || 0;
            const price = parseFloat(tr.querySelector('.inv-price').value) || 0;
            const total = qty * price;
            tr.querySelector('.inv-total').textContent = formatNum(total);
            net += total;
        });
        const vat = net * 0.15;
        const grand = net + vat;
        document.getElementById('invNet').textContent = formatNum(net);
        document.getElementById('invVat').textContent = formatNum(vat);
        document.getElementById('invTotal').textContent = formatNum(grand);
        window._invNet = net;
        window._invVat = vat;
        window._invGrand = grand;
    }

    // ---------- حفظ الفاتورة ----------
    function saveInvoice() {
        const customerIdx = parseInt(document.getElementById('invoiceCustomer').value);
        if (isNaN(customerIdx) || customerIdx < 0 || !customers[customerIdx]) {
            alert('الرجاء اختيار عميل.');
            return;
        }
        const customer = customers[customerIdx];
        const number = document.getElementById('invoiceNumber').value.trim() || 'INV-' + Date.now();
        const date = document.getElementById('invoiceDate').value || new Date().toISOString().slice(0, 10);
        const paymentMethod = document.getElementById('paymentMethod').value;

        const rows = document.querySelectorAll('#invoiceItemsBody tr');
        const itemsList = [];
        rows.forEach(tr => {
            const name = tr.querySelector('.inv-name').value || 'صنف';
            const qty = parseFloat(tr.querySelector('.inv-qty').value) || 0;
            const price = parseFloat(tr.querySelector('.inv-price').value) || 0;
            const total = qty * price;
            const vat = total * 0.15;
            itemsList.push({ name, qty, price, total, vat, totalWith: total + vat });
        });

        const net = window._invNet || 0;
        const vatTotal = window._invVat || 0;
        const grand = window._invGrand || 0;

        const invoice = {
            id: generateId(),
            number,
            date,
            paymentMethod,
            customerIdx,
            customerName: customer.name,
            items: itemsList,
            net,
            vat: vatTotal,
            total: grand
        };

        invoices.push(invoice);
        saveData();
        renderInvoicesList();
        resetInvoiceForm();
        alert('تم حفظ الفاتورة بنجاح.');
    }

    // ---------- إعادة تعيين نموذج الفاتورة ----------
    function resetInvoiceForm() {
        document.getElementById('invoiceItemsBody').innerHTML = '';
        addInvoiceRow('', 0, 1);
        updateInvoiceTotals();
        document.getElementById('invoiceNumber').value = 'INV-' + (invoices.length + 1).toString().padStart(4, '0');
    }

    // ---------- عرض الفواتير ----------
    function renderInvoicesList() {
        const div = document.getElementById('invoicesList');
        if (invoices.length === 0) {
            div.innerHTML = '<p class="text-gray-400">لا توجد فواتير</p>';
            return;
        }
        let html = '';
        invoices.slice().reverse().forEach((inv, idx) => {
            const realIdx = invoices.length - 1 - idx;
            html += `<div class="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span><strong>${inv.number}</strong> - ${inv.customerName} - ${formatNum(inv.total)} ر.س</span>
                    <div>
                        <button class="print-invoice-btn text-blue-600 underline ml-2" data-idx="${realIdx}">🖨️ طباعة</button>
                        <button class="del-invoice-btn text-red-500" data-idx="${realIdx}">✖</button>
                    </div>
                </div>`;
        });
        div.innerHTML = html;
        div.querySelectorAll('.print-invoice-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                printInvoice(idx);
            });
        });
        div.querySelectorAll('.del-invoice-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                if (confirm('حذف الفاتورة؟')) {
                    invoices.splice(idx, 1);
                    saveData();
                    renderInvoicesList();
                }
            });
        });
    }

    // ---------- طباعة الفاتورة ----------
    function printInvoice(idx) {
        const inv = invoices[idx];
        if (!inv) return;
        const customer = customers[inv.customerIdx] || { name: 'غير معروف', vat: '', phone: '', address: '' };
        const companyName = company.name || 'شركتي';
        const companyVat = company.vat || '';
        const companyReg = company.reg || '';
        const companyAddress = company.address || '';
        const companyPhone = company.phone || '';
        const logoHtml = company.logo ? `<img src="${company.logo}" style="max-height:70px;"/>` : '';

        let itemsHtml = inv.items.map((it, i) => `
                <tr><td>${i+1}</td><td>${it.name}</td><td>${it.qty}</td><td>${formatNum(it.price)}</td><td>${formatNum(it.total)}</td></tr>
            `).join('');

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) { alert('الرجاء السماح للنوافذ المنبثقة.'); return; }

        printWindow.document.write(`
                <html dir="rtl"><head><title>فاتورة ${inv.number}</title>
                <style>
                    * { margin:0; padding:0; box-sizing:border-box; }
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding:30px; direction:rtl; }
                    .invoice-box { max-width:1000px; margin:0 auto; border:1px solid #ddd; padding:30px; }
                    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #22c55e; padding-bottom:15px; margin-bottom:20px; }
                    .company-info h2 { margin:0; }
                    .company-info p { margin:2px 0; font-size:13px; color:#475569; }
                    .invoice-title { text-align:center; font-size:24px; font-weight:bold; margin:15px 0; }
                    .parties-table { width:100%; border-collapse:collapse; margin-bottom:15px; font-size:13px; }
                    .parties-table td { padding:6px 10px; border:1px solid #cbd5e1; vertical-align:top; }
                    .parties-table .label { font-weight:bold; background:#f8fafc; width:15%; }
                    .invoice-number { text-align:left; font-weight:bold; margin:8px 0; }
                    .items-table { width:100%; border-collapse:collapse; margin:15px 0; font-size:13px; }
                    .items-table th { background:#f1f5f9; font-weight:bold; padding:8px; border:1px solid #cbd5e1; text-align:center; }
                    .items-table td { padding:6px; border:1px solid #cbd5e1; text-align:center; }
                    .totals { margin-top:15px; border-top:2px solid #e2e8f0; padding-top:12px; }
                    .totals .row { display:flex; justify-content:space-between; padding:4px 0; }
                    .grand-total { font-size:20px; font-weight:bold; color:#16a34a; }
                    .footer { margin-top:15px; border-top:1px solid #cbd5e1; padding-top:12px; text-align:center; font-size:14px; color:#64748b; }
                    .thank-you { color:#22c55e; font-weight:bold; font-size:16px; }
                    @page { size:A4; margin:10mm; }
                    @media print { body { padding:10px; } .invoice-box { border:none; } }
                </style>
                </head><body>
                <div class="invoice-box">
                    <div class="header">
                        <div class="company-info">
                            <h2>${companyName}</h2>
                            <p>الرقم الضريبي: ${companyVat}</p>
                            <p>رقم السجل: ${companyReg}</p>
                            <p>${companyAddress}</p>
                            <p>هاتف: ${companyPhone}</p>
                        </div>
                        ${logoHtml}
                    </div>
                    <div class="invoice-title">فاتورة ضريبية | Tax Invoice</div>
                    <table class="parties-table">
                        <tr><td class="label">إلى</td><td><strong>${customer.name}</strong><br>${customer.vat||''}<br>${customer.phone||''}<br>${customer.address||''}</td>
                        <td class="label">من</td><td><strong>${companyName}</strong><br>${companyVat}<br>${companyReg}<br>${companyAddress}</td></tr>
                    </table>
                    <div class="invoice-number">رقم الفاتورة: ${inv.number} - التاريخ: ${inv.date}</div>
                    <table class="items-table">
                        <thead><tr><th>#</th><th>الوصف</th><th>الكمية</th><th>السعر</th><th>الإجمالي</th></tr></thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <div class="totals">
                        <div class="row"><strong>المجموع (صافي):</strong> <span>${formatNum(inv.net)} ر.س</span></div>
                        <div class="row"><strong>ضريبة القيمة المضافة (15%):</strong> <span>${formatNum(inv.vat)} ر.س</span></div>
                        <div class="row grand-total"><strong>الإجمالي:</strong> <span>${formatNum(inv.total)} ر.س</span></div>
                    </div>
                    <div class="footer"><div class="thank-you">شكراً لتعاملكم معنا</div></div>
                </div>
                <script>window.onload = function() { window.print(); }<\/script>
                </body></html>
            `);
        printWindow.document.close();
    }

    // ---------- دوال سندات القبض ----------
    function renderReceiptsList() {
        const div = document.getElementById('receiptsList');
        if (receipts.length === 0) {
            div.innerHTML = '<p class="text-gray-400">لا توجد سندات</p>';
            return;
        }
        let html = '';
        receipts.slice().reverse().forEach((r, idx) => {
            const realIdx = receipts.length - 1 - idx;
            const customer = customers.find(c => c.id === r.customerId) || { name: 'غير معروف' };
            html += `<div class="flex justify-between items-center py-2 border-b border-gray-100 text-sm">
                    <span>${customer.name} - ${formatNum(r.amount)} ر.س - ${r.date}</span>
                    <div>
                        <button class="print-receipt-btn text-blue-600 underline ml-2" data-idx="${realIdx}">🖨️ طباعة</button>
                        <button class="del-receipt-btn text-red-500" data-idx="${realIdx}">✖</button>
                    </div>
                </div>`;
        });
        div.innerHTML = html;
        div.querySelectorAll('.print-receipt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                printReceipt(idx);
            });
        });
        div.querySelectorAll('.del-receipt-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.idx);
                if (confirm('حذف سند القبض؟')) {
                    receipts.splice(idx, 1);
                    saveData();
                    renderReceiptsList();
                }
            });
        });
    }

    // ---------- طباعة سند قبض ----------
    function printReceipt(idx) {
        const r = receipts[idx];
        if (!r) return;
        const customer = customers.find(c => c.id === r.customerId) || { name: 'غير معروف', vat: '', phone: '', address: '' };
        const companyName = company.name || 'شركتي';
        const companyVat = company.vat || '';
        const companyAddress = company.address || '';
        const companyPhone = company.phone || '';
        const logoHtml = company.logo ? `<img src="${company.logo}" style="max-height:70px;"/>` : '';

        // دالة تحويل الأرقام إلى حروف
        function numberToWords(num) {
            if (num === 0) return 'صفر ريال سعودي';
            const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
            const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
            const tens = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
            const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
            function convertChunk(n) {
                let word = '';
                const h = Math.floor(n/100), rest = n%100;
                if (h > 0) word += hundreds[h] + ' ';
                if (rest > 0) {
                    if (rest < 10) word += units[rest] + ' ';
                    else if (rest < 20) word += teens[rest-10] + ' ';
                    else { const ten = Math.floor(rest/10), unit = rest%10; word += (unit>0?units[unit]+' و ':'') + tens[ten] + ' '; }
                }
                return word;
            }
            let parts = [], remaining = Math.floor(num), scales = ['', 'ألف', 'مليون', 'مليار'], si=0;
            while (remaining > 0) {
                const chunk = remaining % 1000;
                if (chunk > 0) {
                    let chunkWord = convertChunk(chunk);
                    if (si > 0) {
                        if (chunk === 1) chunkWord = chunkWord.replace('واحد','').trim() + ' ' + scales[si];
                        else if (chunk === 2) chunkWord = chunkWord.replace('اثنان','').trim() + ' ' + scales[si] + 'ان';
                        else chunkWord += scales[si] + ' ';
                    }
                    parts.unshift(chunkWord.trim());
                }
                remaining = Math.floor(remaining/1000); si++;
            }
            let result = parts.join(' و ');
            const fraction = Math.round((num - Math.floor(num)) * 100);
            let fractionText = '';
            if (fraction > 0) {
                if (fraction === 1) fractionText = ' و هللة واحدة';
                else if (fraction === 2) fractionText = ' و هللتان';
                else fractionText = ' و ' + convertChunk(fraction) + ' هللة';
            }
            const integerPart = Math.floor(num);
            let currencyText = '';
            if (integerPart === 0) currencyText = 'ريالاً';
            else if (integerPart === 1) currencyText = 'ريال';
            else if (integerPart === 2) currencyText = 'ريالان';
            else if (integerPart >= 3 && integerPart <= 10) currencyText = 'ريالات';
            else currencyText = 'ريالاً';
            result = result.trim() + ' ' + currencyText + fractionText;
            return result;
        }

        const amountWords = numberToWords(r.amount);

        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (!printWindow) { alert('الرجاء السماح للنوافذ المنبثقة.'); return; }

        printWindow.document.write(`
                <html dir="rtl"><head><title>سند قبض</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, sans-serif; padding:30px; direction:rtl; }
                    .header { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #22c55e; padding-bottom:10px; }
                    .receipt-info { margin:20px 0; padding:16px; border:1px dashed #22c55e; border-radius:12px; }
                    .row { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px solid #e5e7eb; }
                    .row:last-child { border-bottom:none; }
                    .amount { font-size:24px; font-weight:bold; color:#16a34a; }
                    .amount-words { margin-top:15px; font-weight:bold; border-top:2px dashed #cbd5e1; padding-top:12px; font-size:14px; background:#f1f5f9; padding:10px; border-radius:8px; }
                    @page { margin:15mm; }
                </style>
                </head><body>
                <div class="header">
                    <div class="company-info">
                        <h2>${companyName}</h2>
                        <p>الرقم الضريبي: ${companyVat}</p>
                        <p>${companyAddress}</p>
                        <p>هاتف: ${companyPhone}</p>
                    </div>
                    ${logoHtml}
                </div>
                <h1 style="text-align:center;color:#2563eb;">سند قبض</h1>
                <div class="receipt-info">
                    <div class="row"><span><strong>العميل:</strong></span><span>${customer.name} (${customer.vat||''})</span></div>
                    <div class="row"><span><strong>المبلغ:</strong></span><span class="amount">${formatNum(r.amount)} ر.س</span></div>
                    <div class="row"><span><strong>التاريخ:</strong></span><span>${r.date}</span></div>
                    <div class="row"><span><strong>رقم الفاتورة المرجعي:</strong></span><span>${r.invoiceRef || 'بدون مرجع'}</span></div>
                </div>
                <div class="amount-words">المبلغ بالحروف: ${amountWords} فقط لا غير</div>
                <div style="margin-top:20px;text-align:center;">
                    <p>تم استلام المبلغ أعلاه نقداً / تحويل بنكي</p>
                    <p style="margin-top:30px;">_________________<br>توقيع المستلم</p>
                </div>
                <script>window.onload = function() { window.print(); }<\/script>
                </body></html>
            `);
        printWindow.document.close();
    }

    // ---------- حفظ سند قبض ----------
    function saveReceipt() {
        const customerIdx = parseInt(document.getElementById('receiptCustomer').value);
        if (isNaN(customerIdx) || customerIdx < 0 || !customers[customerIdx]) {
            alert('اختر عميلاً.');
            return;
        }
        const customer = customers[customerIdx];
        const amount = parseFloat(document.getElementById('receiptAmount').value);
        if (!amount || amount <= 0) { alert('أدخل مبلغاً صحيحاً.'); return; }
        const date = document.getElementById('receiptDate').value || new Date().toISOString().slice(0, 10);
        const invoiceRef = document.getElementById('receiptInvoiceRef').value.trim();

        receipts.push({
            id: generateId(),
            customerId: customer.id || customerIdx,
            customerName: customer.name,
            amount,
            date,
            invoiceRef
        });
        saveData();
        renderReceiptsList();
        document.getElementById('receiptAmount').value = '';
        document.getElementById('receiptInvoiceRef').value = '';
        alert('تم حفظ سند القبض.');
    }

    // ---------- كشف الحساب ----------
    function showAccount() {
        const idx = parseInt(document.getElementById('accountCustomer').value);
        if (isNaN(idx) || idx < 0 || !customers[idx]) {
            document.getElementById('accountResult').innerHTML = '<p class="text-red-500">اختر عميلاً.</p>';
            return;
        }
        const customer = customers[idx];
        const fromDate = document.getElementById('accountFrom').value;
        const toDate = document.getElementById('accountTo').value;

        let custInvoices = invoices.filter(inv => inv.customerIdx === idx);
        let custReceipts = receipts.filter(r => r.customerId === customer.id || r.customerIdx === idx);

        if (fromDate) {
            custInvoices = custInvoices.filter(inv => inv.date >= fromDate);
            custReceipts = custReceipts.filter(r => r.date >= fromDate);
        }
        if (toDate) {
            custInvoices = custInvoices.filter(inv => inv.date <= toDate);
            custReceipts = custReceipts.filter(r => r.date <= toDate);
        }

        let movements = [];
        custInvoices.forEach(inv => {
            movements.push({ date: inv.date, type: 'فاتورة', reference: inv.number, debit: inv.total, credit: 0, balance: 0 });
        });
        custReceipts.forEach(r => {
            movements.push({ date: r.date, type: 'سند قبض', reference: r.invoiceRef || 'بدون مرجع', debit: 0, credit: r.amount, balance: 0 });
        });
        movements.sort((a, b) => a.date.localeCompare(b.date));

        let balance = 0;
        let html = `<h4 class="font-bold">كشف حساب: ${customer.name}</h4>
                        <p class="text-sm text-gray-500">من ${fromDate || 'البداية'} إلى ${toDate || 'النهاية'}</p>
                        <div class="table-wrap"><table class="w-full text-sm mt-2">
                        <thead><tr><th>التاريخ</th><th>النوع</th><th>المرجع</th><th>مدين</th><th>دائن</th><th>الرصيد</th></tr></thead><tbody>`;
        if (movements.length === 0) {
            html += `<tr><td colspan="6" class="text-center text-gray-400">لا توجد حركات</td></tr>`;
        } else {
            movements.forEach(m => {
                balance += (m.debit || 0) - (m.credit || 0);
                html += `<tr><td>${m.date}</td><td>${m.type}</td><td>${m.reference}</td>
                            <td>${m.debit ? formatNum(m.debit) : '-'}</td>
                            <td>${m.credit ? formatNum(m.credit) : '-'}</td>
                            <td>${formatNum(balance)}</td></tr>`;
            });
        }
        html += `</tbody></table></div><div class="mt-2 font-bold">الرصيد الحالي: ${formatNum(balance)} ر.س</div>`;
        document.getElementById('accountResult').innerHTML = html;
    }

    // ---------- طباعة كشف الحساب ----------
    document.getElementById('printAccountBtn').addEventListener('click', function() {
        const html = document.getElementById('accountResult').innerHTML;
        const printWindow = window.open('', '_blank', 'width=900,height=600');
        if (!printWindow) { alert('الرجاء السماح للنوافذ المنبثقة.'); return; }
        printWindow.document.write(`
                <html dir="rtl"><head><title>كشف حساب</title>
                <style>body{font-family:'Segoe UI',sans-serif;padding:30px;direction:rtl;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:8px;text-align:center;} th{background:#f1f5f9;}</style>
                </head><body>${html}<script>window.onload=function(){window.print();}<\/script></body></html>
            `);
        printWindow.document.close();
    });

    // ---------- إعدادات الشركة ----------
    function saveSettings() {
        const name = document.getElementById('companyName').value.trim();
        const vat = document.getElementById('companyVat').value.trim();
        const reg = document.getElementById('companyReg').value.trim();
        const address = document.getElementById('companyAddress').value.trim();
        const phone = document.getElementById('companyPhone').value.trim();
        const email = document.getElementById('companyEmail').value.trim();

        const fileInput = document.getElementById('companyLogo');
        if (fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(e) {
                company.logo = e.target.result;
                company.name = name; company.vat = vat; company.reg = reg;
                company.address = address; company.phone = phone; company.email = email;
                saveData();
                updateCompanyHeader();
                document.getElementById('settingsLogoPreview').src = company.logo;
                alert('تم حفظ الإعدادات والشعار.');
            };
            reader.readAsDataURL(fileInput.files[0]);
        } else {
            company.name = name; company.vat = vat; company.reg = reg;
            company.address = address; company.phone = phone; company.email = email;
            saveData();
            updateCompanyHeader();
            alert('تم حفظ الإعدادات.');
        }
    }

    // ---------- عرض الكل ----------
    function renderAll() {
        renderCustomerList();
        renderItemsList();
        renderInvoicesList();
        renderReceiptsList();
        populateSelects();
        document.getElementById('companyName').value = company.name || '';
        document.getElementById('companyVat').value = company.vat || '';
        document.getElementById('companyReg').value = company.reg || '';
        document.getElementById('companyAddress').value = company.address || '';
        document.getElementById('companyPhone').value = company.phone || '';
        document.getElementById('companyEmail').value = company.email || '';
        if (company.logo) {
            document.getElementById('settingsLogoPreview').src = company.logo;
        }
        const today = new Date().toISOString().slice(0, 10);
        if (!document.getElementById('invoiceDate').value) document.getElementById('invoiceDate').value = today;
        if (!document.getElementById('receiptDate').value) document.getElementById('receiptDate').value = today;
        const firstDay = new Date(); firstDay.setDate(1);
        document.getElementById('accountFrom').value = firstDay.toISOString().slice(0, 10);
        document.getElementById('accountTo').value = today;
        updateStats();
        updateBadges();

        // تاريخ اليوم في تذييل القائمة
        const now = new Date();
        document.getElementById('currentDate').textContent = now.toLocaleDateString('ar-SA');
    }

    // ---------- ربط الأحداث ----------
    document.addEventListener('DOMContentLoaded', function() {
        renderAll();

        // التبويبات
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.menu-item').forEach(a => a.classList.remove('active'));
                this.classList.add('active');
                document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
                document.getElementById('tab-' + this.dataset.tab).classList.add('active');
            });
        });

        // إضافة صنف للفاتورة
        document.getElementById('addItemBtn').addEventListener('click', function() {
            addInvoiceRow('', 0, 1);
        });

        // حفظ الفاتورة
        document.getElementById('saveInvoiceBtn').addEventListener('click', saveInvoice);

        // إعادة تعيين
        document.getElementById('resetInvoiceBtn').addEventListener('click', resetInvoiceForm);

        // إضافة عميل
        document.getElementById('saveCustomerBtn').addEventListener('click', function() {
            const name = document.getElementById('newCustomerName').value.trim();
            const vat = document.getElementById('newCustomerVat').value.trim();
            const phone = document.getElementById('newCustomerPhone').value.trim();
            const address = document.getElementById('newCustomerAddress').value.trim();
            if (!name) { alert('أدخل اسم العميل.'); return; }
            customers.push({ id: generateId(), name, vat, phone, address });
            saveData();
            renderAll();
            document.getElementById('newCustomerName').value = '';
            document.getElementById('newCustomerVat').value = '';
            document.getElementById('newCustomerPhone').value = '';
            document.getElementById('newCustomerAddress').value = '';
        });

        // إضافة صنف
        document.getElementById('saveItemBtn').addEventListener('click', function() {
            const name = document.getElementById('newItemName').value.trim();
            const price = parseFloat(document.getElementById('newItemPrice').value);
            const unit = document.getElementById('newItemUnit').value.trim();
            if (!name || isNaN(price) || price < 0) { alert('أدخل بيانات صحيحة.'); return; }
            items.push({ id: generateId(), name, price, unit });
            saveData();
            renderItemsList();
            document.getElementById('newItemName').value = '';
            document.getElementById('newItemPrice').value = '';
            document.getElementById('newItemUnit').value = '';
        });

        // سند قبض
        document.getElementById('saveReceiptBtn').addEventListener('click', saveReceipt);

        // كشف حساب
        document.getElementById('showAccountBtn').addEventListener('click', showAccount);

        // إعدادات
        document.getElementById('saveSettingsBtn').addEventListener('click', saveSettings);

        // البحث في العملاء
        document.getElementById('searchCustomer').addEventListener('input', function() {
            const term = this.value.toLowerCase();
            document.querySelectorAll('#customerList li').forEach(li => {
                li.style.display = li.textContent.toLowerCase().includes(term) ? 'flex' : 'none';
            });
        });

        // بدء بفاتورة نموذجية
        if (invoices.length === 0) {
            addInvoiceRow('منتج تجريبي', 100, 1);
            updateInvoiceTotals();
        }
    });

})();