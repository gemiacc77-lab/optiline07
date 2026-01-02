document.addEventListener("DOMContentLoaded", function() {
    
    // إعدادات الويب هوك الخاص بك (استبدل الرابط برابط Apps Script)
    const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycby7gLcf4CWhllMBeYmJsNMaL51psDy5Iud-FvFR-GAfw3P5S2NeJ-dkVxtUMJWPuPci/exec";

    // تعريف الباقات وأسعارها (يجب أن تطابق ما في موقعك)
    const packages = [
        { id: 'paypal-button-core', price: '699', name: 'CORE PACK' },
        { id: 'paypal-button-nexus', price: '1299', name: 'NEXUS PACK' },
        { id: 'paypal-button-matrix', price: '1699', name: 'MATRIX PACK' }
    ];

    // دالة لإنشاء الأزرار تلقائياً
    packages.forEach(pkg => {
        // نتأكد أن العنصر موجود في الصفحة قبل محاولة رسم الزر
        if (document.getElementById(pkg.id)) {
            renderPayPalButton(pkg.id, pkg.price, pkg.name);
        }
    });

    function renderPayPalButton(containerId, price, packageName) {
        paypal.Buttons({
            style: {
                shape: 'rect',
                color: 'blue', // أو 'gold', 'black', 'white'
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
                return actions.order.capture().then(function(details) {
                    
                    // إظهار رسالة نجاح فورية (يمكنك تحسينها لاحقاً)
                    alert('Payment Successful! Thank you, ' + details.payer.name.given_name);

                    // إرسال البيانات إلى Google Sheets في الخلفية
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        mode: 'no-cors', // مهم جداً لتجنب مشاكل المتصفح
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            event_type: "PAYMENT.CAPTURE.COMPLETED", // محاكاة لحدث الويب هوك
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
                        // توجيه لصفحة الشكر (اختياري)
                        // window.location.href = "/thank-you.html";
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
