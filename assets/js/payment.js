document.addEventListener("DOMContentLoaded", function() {
    
    // هذا هو رابط الـ Web App الخاص بك (تأكد من أنه ينتهي بـ /exec)
    const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwWNsRWtnGwvE66VpDOeishxk6jGRT6oJ6Qup73vgHI7mjbMvPPQoTAFcdeHC9CD-_RJQ/exec";

    const packages = [
        { 
            id: 'paypal-button-core', 
            price: '699', 
            name: 'CORE PACK'
        },
        { 
            id: 'paypal-button-nexus', 
            price: '1299', 
            name: 'NEXUS PACK'
        },
        { 
            id: 'paypal-button-matrix', 
            price: '1699', 
            name: 'MATRIX PACK'
        }
    ];

    packages.forEach(pkg => {
        if (document.getElementById(pkg.id)) {
            renderPayPalButton(pkg.id, pkg.price, pkg.name);
        }
    });

    function renderPayPalButton(containerId, price, packageName) {
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
                        amount: { value: price }
                    }]
                });
            },
            onApprove: function(data, actions) {
                // إظهار رسالة تحميل
                // يمكنك إضافة كود هنا لإظهار Spinner

                return actions.order.capture().then(function(details) {
                    
                    // 1. إرسال البيانات للتوثيق (Webhook)
                    fetch(WEBHOOK_URL, {
                        method: 'POST',
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            event_type: "PAYMENT.CAPTURE.COMPLETED",
                            resource: {
                                id: details.id,
                                amount: { value: price },
                                payer: details.payer
                            }
                        })
                    }).then(() => {
                        console.log("Sale Recorded");

                        // 2. التوجيه الذكي (Smart Redirect)
                        // نوجه العميل مباشرة لصفحة السكريبت مع تمرير البيانات في الرابط
                        const redirectUrl = `${WEBHOOK_URL}?pkg=${encodeURIComponent(packageName)}&tx=${details.id}&marketer=${localStorage.getItem('optiline_marketer_ref') || ''}`;
                        
                        window.location.href = redirectUrl;
                    });
                });
            },
            onError: function(err) {
                console.error('PayPal Error:', err);
                alert("Payment Error. Please try again.");
            }
        }).render('#' + containerId);
    }
});
