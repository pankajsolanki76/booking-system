import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly stripe: any = null;
  private readonly isMockMode: boolean = false;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey || apiKey === 'mock' || apiKey === 'mock_key') {
      this.isMockMode = true;
      this.logger.warn('Stripe API Key is not set or set to mock. Running in simulation mode.');
    } else {
      this.stripe = new Stripe(apiKey, {
        apiVersion: '2025-01-27.accredited' as any, // Use standard typescript compatible typing
      });
    }
  }

  getIsMockMode(): boolean {
    return this.isMockMode;
  }

  async createCheckoutSession(
    bookingId: string,
    amount: number,
    eventTitle: string,
    userId: string,
  ): Promise<{ sessionId: string; url: string }> {
    if (this.isMockMode) {
      const sessionId = `cs_test_mock_${bookingId}_${Date.now()}`;
      const baseUrl = this.configService.get<string>('API_BASE_URL') || 'http://localhost:3001';
      const mockUrl = `${baseUrl}/payments/mock-checkout?bookingId=${bookingId}&sessionId=${sessionId}`;
      return {
        sessionId,
        url: mockUrl,
      };
    }

    try {
      const successUrl = this.configService.get<string>('STRIPE_SUCCESS_URL') || `http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = this.configService.get<string>('STRIPE_CANCEL_URL') || 'http://localhost:3000/cancel';

      const session = await this.stripe!.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Ticket(s) for ${eventTitle}`,
              },
              unit_amount: Math.round(amount * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          bookingId,
          userId,
        },
      });

      return {
        sessionId: session.id,
        url: session.url || '',
      };
    } catch (err: any) {
      this.logger.error(`Stripe session creation failed for booking ${bookingId}: ${err.message}`);
      throw err;
    }
  }

  verifyWebhook(rawBody: Buffer, signature: string): any {
    if (this.isMockMode) {
      try {
        const payload = JSON.parse(rawBody.toString('utf8'));
        return payload;
      } catch (err: any) {
        throw new Error(`Invalid mock webhook payload: ${err.message}`);
      }
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe!.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err: any) {
      this.logger.error(`Webhook signature verification failed: ${err.message}`);
      throw err;
    }
  }

  async createRefund(transactionRef: string, amount?: number): Promise<{ refundId: string }> {
    if (this.isMockMode || transactionRef.startsWith('cs_test_mock_') || transactionRef === 'N/A') {
      const refundId = `re_test_mock_${Date.now()}`;
      this.logger.log(`Mock Refund successfully created for transaction ${transactionRef}, amount: ${amount}`);
      return { refundId };
    }

    try {
      const refund = await this.stripe!.refunds.create({
        payment_intent: transactionRef,
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      });

      return {
        refundId: refund.id,
      };
    } catch (err: any) {
      this.logger.error(`Stripe refund failed for transaction ${transactionRef}: ${err.message}`);
      throw err;
    }
  }
}
