/**
 * OPTILINE PAYMENT CLIENT
 * Handles UI states, PayPal interactions, and smart redirection.
 */

// Inject the Overlay HTML automatically when the script loads
document.addEventListener("DOMContentLoaded", function() {
    const overlayHTML = `
    <div id="payment-overlay">
        <div class="payment-status-card">
            <div id="loading-state">
                <div class="optiline-spinner"></div>
                <div class="status-text">
                    <h3>Processing Payment</h3>
                    <p>Securing your transaction...</p>
                </div>
            </div>
            <div id="success-state" style="display:none;">
                <div class="success-checkmark">
                    <i class="fas fa-check"></i>
                </div>
                <div class="status-text">
                    <h3 style="color: #a855f7;">Payment Approved</h3>
                    <p>Redirecting to secure setup...</p>
                </div>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', overlayHTML);
});

// UI Helper Functions
const UI = {
    overlay: () => document.getElementById('payment-overlay'),
    loading: () => document.getElementById('loading-state'),
    success: () => document.getElementById('success-state'),
    
    showProcessing: function() {
        this.overlay().classList.add('active');
        this.loading().style.display = 'block';
        this.success().style.display = 'none';
    },
    
    showSuccess: function() {
        this.loading().style.display = 'none';
        this.success().style.display = 'block';
        document.querySelector('.success-checkmark').classList.add('animate-check');
    },
    
    hide: function() {
        this.overlay().classList.remove('active');
    }
};

/**
 * Initializes the PayPal Button
 * @param {Object} config - { containerId, price, packageName }
 */
function initPayPalButton(config) {
    // UPDATED WEBHOOK URL (Replace with your NEW deployment URL)
    const WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbwWNsRWtnGwvE66VpDOeishxk6jGRT6oJ6Qup73vgHI7mjbMvPPQoTAFcdeHC9CD-_RJQ/exec";

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
                    description: config.packageName,
                    amount: { value: config.price }
                }]
            });
        },
        onApprove: function(data, actions) {
            // 1. Show Processing UI immediately
            UI.showProcessing();

            return actions.order.capture().then(function(details) {
                console.log("Payment Captured. Verifying with server...");

                // 2. Send to Backend to verify & get Smart Redirect URL
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    // 'text/plain' prevents CORS preflight issues with GAS
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                    body: JSON.stringify({
                        event_type: "PAYMENT.CAPTURE.COMPLETED",
                        resource: {
                            id: details.id,
                            amount: { value: config.price },
                            payer: details.payer,
                            package: config.packageName,
                            marketer: localStorage.getItem('optiline_marketer_ref') || ''
                        }
                    })
                })
                .then(response => response.json())
                .then(serverData => {
                    if (serverData.status === 'success' && serverData.url) {
                        // 3. Show Success Animation
                        UI.showSuccess();
                        
                        // 4. Redirect after short delay to let user see the success message
                        setTimeout(() => {
                            window.location.href = serverData.url;
                        }, 2000); // 2 seconds delay
                    } else {
                        throw new Error(serverData.message || "Server verification failed");
                    }
                })
                .catch(err => {
                    console.error("Redirection Logic Error:", err);
                    alert("Payment successful (ID: " + details.id + "), but automatic redirection failed. Please contact support.");
                    UI.hide();
                });
            });
        },
        onError: function(err) {
            console.error('PayPal Error:', err);
            UI.hide();
            alert("Payment could not be processed. Please try again.");
        }
    }).render('#' + config.containerId);
}
