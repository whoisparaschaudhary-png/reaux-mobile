import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, BackHandler } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeScreen } from '../../../src/components/layout/SafeScreen';
import { Header } from '../../../src/components/layout/Header';
import { paymentsApi, type RazorpayOrderResponse } from '../../../src/api/endpoints/payments';
import { useAuthStore } from '../../../src/stores/useAuthStore';
import { useCartStore } from '../../../src/stores/useCartStore';
import { showAppAlert } from '../../../src/stores/useUIStore';
import { API_URL, ONLINE_PAYMENT_ENABLED } from '../../../src/utils/constants';
import { colors, fontFamily, spacing } from '../../../src/theme';
import { ms } from '../../../src/utils/responsive';

/**
 * Razorpay's checkout.js refuses to run from an opaque origin, so the page is
 * given the API origin as its baseUrl. This domain must also be allowed in the
 * Razorpay dashboard for live keys.
 */
const CHECKOUT_ORIGIN = API_URL.replace(/\/api\/?$/, '');

const escapeJs = (value: string) => JSON.stringify(value ?? '');

const buildCheckoutHtml = (
  rzp: RazorpayOrderResponse,
  user: { name?: string; email?: string; phone?: string },
) => `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; background: #ffffff; font-family: -apple-system, sans-serif; }
    </style>
  </head>
  <body>
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <script>
      var post = function (payload) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      };

      try {
        var rzp = new Razorpay({
          key: ${escapeJs(rzp.keyId)},
          order_id: ${escapeJs(rzp.razorpayOrderId)},
          amount: ${rzp.amount},
          currency: ${escapeJs(rzp.currency)},
          name: 'REAUX Labs',
          description: 'Order payment',
          prefill: {
            name: ${escapeJs(user.name ?? '')},
            email: ${escapeJs(user.email ?? '')},
            contact: ${escapeJs(user.phone ?? '')}
          },
          theme: { color: '#f9f506' },
          modal: {
            ondismiss: function () { post({ type: 'dismissed' }); }
          },
          handler: function (response) {
            post({
              type: 'success',
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            });
          }
        });

        rzp.on('payment.failed', function (response) {
          post({ type: 'failed', reason: (response && response.error && response.error.description) || 'Payment failed' });
        });

        rzp.open();
      } catch (err) {
        post({ type: 'failed', reason: String(err) });
      }
    </script>
  </body>
</html>`;

export default function PaymentScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const user = useAuthStore((s) => s.user);
  const fetchCart = useCartStore((s) => s.fetchCart);

  const [rzp, setRzp] = useState<RazorpayOrderResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Guards against the WebView firing more than one terminal event.
  const settled = useRef(false);

  // Online payments are gated off (Razorpay not live yet). This screen should be
  // unreachable through the UI, but guard it so a stale deep-link can't strand
  // the user on a dead checkout — bounce back to their orders.
  useEffect(() => {
    if (!ONLINE_PAYMENT_ENABLED) {
      router.replace('/(app)/(shop)/orders');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!ONLINE_PAYMENT_ENABLED || !orderId) return;
      try {
        const response = await paymentsApi.createRazorpayOrder(orderId);
        if (!cancelled) setRzp(response.data);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Could not start the payment.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const goToOrders = useCallback(() => {
    fetchCart();
    router.replace('/(app)/(shop)/orders');
  }, [fetchCart]);

  const abandon = useCallback(
    async (message: string) => {
      if (settled.current) return;
      settled.current = true;
      if (orderId) {
        await paymentsApi.markFailed(orderId).catch(() => {});
      }
      showAppAlert('Payment not completed', message, [
        { text: 'OK', onPress: goToOrders },
      ]);
    },
    [orderId, goToOrders],
  );

  const handleMessage = useCallback(
    async (event: WebViewMessageEvent) => {
      let payload: any;
      try {
        payload = JSON.parse(event.nativeEvent.data);
      } catch {
        return;
      }

      if (payload.type === 'success') {
        if (settled.current) return;
        settled.current = true;
        setIsVerifying(true);
        try {
          // The server re-checks the signature; only it can mark the order paid.
          await paymentsApi.verify({
            razorpayOrderId: payload.razorpayOrderId,
            razorpayPaymentId: payload.razorpayPaymentId,
            signature: payload.signature,
          });
          showAppAlert('Payment successful', 'Your order is confirmed.', [
            { text: 'View orders', onPress: goToOrders },
          ]);
        } catch (err: any) {
          showAppAlert(
            'Payment could not be verified',
            err.message || 'If money was deducted it will be refunded automatically.',
            [{ text: 'OK', onPress: goToOrders }],
          );
        } finally {
          setIsVerifying(false);
        }
        return;
      }

      if (payload.type === 'failed') {
        await abandon(payload.reason || 'The payment failed. Your order is still pending.');
        return;
      }

      if (payload.type === 'dismissed') {
        await abandon('You closed the payment window. Your order is still pending.');
      }
    },
    [abandon, goToOrders],
  );

  // Leaving mid-payment must not silently strand a pending order.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      abandon('Payment cancelled. Your order is still pending.');
      return true;
    });
    return () => sub.remove();
  }, [abandon]);

  if (error) {
    return (
      <SafeScreen>
        <Header title="Payment" showBack onBack={goToOrders} />
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.hint}>Your order was placed and is awaiting payment.</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <Header
        title="Payment"
        showBack
        onBack={() => abandon('Payment cancelled. Your order is still pending.')}
      />
      {!rzp || isVerifying ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary.yellow} />
          <Text style={styles.hint}>
            {isVerifying ? 'Confirming your payment...' : 'Opening secure checkout...'}
          </Text>
        </View>
      ) : (
        <WebView
          source={{
            html: buildCheckoutHtml(rzp, {
              name: user?.name,
              email: user?.email,
              phone: user?.phone,
            }),
            baseUrl: CHECKOUT_ORIGIN,
          }}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.primary.yellow} />
            </View>
          )}
        />
      )}
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  hint: {
    fontFamily: fontFamily.regular,
    fontSize: ms(14),
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: fontFamily.medium,
    fontSize: ms(16),
    color: colors.status.error,
    textAlign: 'center',
  },
});
