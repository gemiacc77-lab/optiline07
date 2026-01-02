document.addEventListener("DOMContentLoaded", function() {
    
    // إعدادات الويب هوك الخاص بك (لإرسال إشعار البيع للشيت الرئيسي)
    const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwWNsRWtnGwvE66VpDOeishxk6jGRT6oJ6Qup73vgHI7mjbMvPPQoTAFcdeHC9CD-_RJQ/exec";

    /**
     * تعريف الباقات والروابط السرية
     * هنا نضع رابط صفحة المشروع المخصصة لكل باقة داخل المتغير returnUrl
     * هذه الروابط لن تظهر للمستخدم إلا بعد الدفع
     */
    const packages = [
        { 
            id: 'paypal-button-core', 
            price: '699', 
            name: 'CORE PACK',
            // رابط صفحة مشروع الكور
            returnUrl: '/project-submit-1a91z7p/' 
        },
        { 
            id: 'paypal-button-nexus', 
            price: '1299', 
            name: 'NEXUS PACK',
            // رابط صفحة مشروع نكستس
            returnUrl: '/project-submit-2bgf5xedSt/' 
        },
        { 
            id: 'paypal-button-matrix', 
            price: '1699', 
            name: 'MATRIX PACK',
            // رابط صفحة مشروع ماتريكس
            returnUrl: '/project-submit-3c5gsu34/' 
        }
    ];

    // دالة لإنشاء الأزرار تلقائياً
    packages.forEach(pkg => {
        // نتأكد أن العنصر موجود في الصفحة الحالية قبل محاولة رسم الزر
        if (document.getElementById(pkg.id)) {
            renderPayPalButton(pkg.id, pkg.price, pkg.name, pkg.returnUrl);
        }
    });

    function renderPayPalButton(containerId, price, packageName, returnUrl) {
        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'blue', 
                layout: 'vertical',
                label: 'pay',
            },
            createOrder: function(data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        description: packageName,
                        amount: {
                            value: price
                        }
                    }]
                });
            },
            onApprove: function(data, actions) {
                // إظهار مؤشر تحميل أو رسالة انتظار ليعرف العميل أن العملية قيد المعالجة
                // (اختياري: يمكنك إضافة كود هنا لتغيير نص الزر إلى "Processing...")
                
                return actions.order.capture().then(function(details) {
                    
                    // 1. إرسال البيانات إلى Google Sheets (Verified Sales) في الخلفية
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            event_type: "PAYMENT.CAPTURE.COMPLETED",
                            resource: {
                                id: details.id,
                                amount: { value: price },
                                payer: {
                                    name: details.payer.name,
                                    email_address: details.payer.email_address,
                                    payer_id: details.payer.payer_id
                                }
                            }
                        })
                    }).then(() => {
                        console.log("Data sent to Optiline System");
                        
                        // 2. التوجيه لصفحة المشروع السرية بعد نجاح الدفع والحفظ
                        // نقوم بتمرير رقم العملية (tx) في الرابط لأن صفحة المشروع تحتاجه
                        window.location.href = returnUrl + "?tx=" + details.id;
                        
                    }).catch(err => {
                        console.error("Webhook Error", err);
                        // حتى لو فشل الويب هوك، نقوم بتوجيه العميل لصفحة المشروع لكي لا يضيع
                        window.location.href = returnUrl + "?tx=" + details.id;
                    });
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                alert("An error occurred during payment. Please try again.");
            }
        }).render('#' + containerId);
    }
});
