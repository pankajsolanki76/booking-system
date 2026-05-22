import { Body, Controller, Get, Param, Patch, Query, Post, Req, Headers, Res, BadRequestException } from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Payment } from '@prisma/client';

import { PaymentService } from './payment.service';

import { ProcessPaymentDto } from './dto/process-payment.dto';

import { BaseController } from '../common/controllers/base.controller';

import { Role } from '../common/enums/role.enum';

import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth')
@Controller('payments')
export class PaymentController extends BaseController<Payment, any, never> {
  constructor(private readonly paymentService: PaymentService) {
    super(paymentService);
  }

  @Patch(':bookingId/process')
  @Auth()
  @ApiOperation({
    summary: 'Process booking payment',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment processed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Booking expired or payment failed',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  async processPayment(
    @Param('bookingId')
    bookingId: string,

    @Body()
    dto: ProcessPaymentDto,

    @CurrentUser()
    currentUser: any,
  ) {
    return this.paymentService.processPayment(
      bookingId,

      dto.simulateSuccess,

      currentUser.id,
    );
  }

  @Get()
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Get all payments (Admin only)',
  })
  override async findAll(@Query() query: any) {
    return super.findAll(query);
  }

  @Get(':id')
  @Auth(Role.ADMIN)
  @ApiOperation({
    summary: 'Get payment details (Admin only)',
  })
  override async findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post(':bookingId/checkout-session')
  @Auth()
  @ApiOperation({ summary: 'Create Stripe Checkout Session' })
  async createCheckoutSession(
    @Param('bookingId') bookingId: string,
    @CurrentUser() currentUser: any,
  ) {
    return this.paymentService.createCheckoutSession(bookingId, currentUser.id);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe Webhook callback' })
  async handleWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!req.rawBody) {
      throw new BadRequestException('Raw body not available');
    }
    return this.paymentService.handleWebhook(req.rawBody, signature);
  }

  @Get('mock-checkout')
  @ApiOperation({ summary: 'Stripe Mock Checkout Sandbox Page' })
  async serveMockCheckout(
    @Query('bookingId') bookingId: string,
    @Query('sessionId') sessionId: string,
    @Res() res: any,
  ) {
    const booking = await this.paymentService.getBookingForMock(bookingId);
    if (!booking) {
      res.type('html').send(`
        <div style="background:#090b11; color:#f43f5e; font-family:sans-serif; text-align:center; padding:50px; min-height:100vh; display:flex; align-items:center; justify-content:center; flex-direction:column;">
          <h1>Booking Not Found</h1>
          <p style="color:#9ca3af">The booking reference you provided is invalid or has expired.</p>
        </div>
      `);
      return;
    }
    
    const eventTitle = booking.show?.event?.title || 'Event Ticket';
    const totalAmount = Number(booking.totalAmount);
    const userId = booking.userId;

    const html = MOCK_CHECKOUT_HTML
      .replace(/{{EVENT_TITLE}}/g, eventTitle)
      .replace(/{{BOOKING_ID}}/g, bookingId)
      .replace(/{{SESSION_ID}}/g, sessionId)
      .replace(/{{TOTAL_AMOUNT}}/g, totalAmount.toFixed(2))
      .replace(/{{USER_ID}}/g, userId);

    res.type('html').send(html);
  }

  @Post('mock-checkout/cancel')
  @ApiOperation({ summary: 'Cancel checkout session' })
  async mockCancel(@Query('bookingId') bookingId: string) {
    return this.paymentService.cancelPendingBooking(bookingId);
  }
}

const MOCK_CHECKOUT_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Safe & Secure Checkout | SimuPay</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090b11;
      --card-bg: rgba(17, 25, 40, 0.65);
      --card-border: rgba(255, 255, 255, 0.08);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #6366f1;
      --primary-glow: rgba(99, 102, 241, 0.3);
      --success: #10b981;
      --success-glow: rgba(16, 185, 129, 0.3);
      --error: #f43f5e;
      --error-glow: rgba(244, 63, 94, 0.3);
    }
    
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Outfit', sans-serif;
    }
    
    body {
      background-color: var(--bg);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow-x: hidden;
      position: relative;
    }

    body::before, body::after {
      content: '';
      position: absolute;
      width: 400px;
      height: 400px;
      border-radius: 50%;
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
      filter: blur(100px);
      z-index: -1;
      opacity: 0.15;
    }
    body::before {
      top: -100px;
      left: -100px;
    }
    body::after {
      bottom: -100px;
      right: -100px;
    }
    
    .checkout-container {
      width: 100%;
      max-width: 480px;
      background: var(--card-bg);
      backdrop-filter: blur(20px) saturate(180%);
      -webkit-backdrop-filter: blur(20px) saturate(180%);
      border: 1px solid var(--card-border);
      border-radius: 24px;
      padding: 32px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      position: relative;
      animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      background: linear-gradient(135deg, #a5b4fc 0%, var(--primary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .booking-summary {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 24px;
    }
    
    .event-title {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 4px;
    }
    
    .booking-id {
      font-size: 0.75rem;
      color: var(--text-muted);
      word-break: break-all;
    }
    
    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    .price-label {
      color: var(--text-muted);
      font-size: 0.9rem;
    }
    
    .price-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 8px;
    }
    
    .input-wrapper {
      position: relative;
    }
    
    input {
      width: 100%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 14px 16px;
      color: #fff;
      font-size: 1rem;
      transition: all 0.2s ease;
    }
    
    input:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 3px var(--primary-glow);
    }
    
    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 32px;
    }
    
    .btn {
      width: 100%;
      border: none;
      border-radius: 12px;
      padding: 16px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .btn-success {
      background: var(--success);
      color: #032d1f;
      box-shadow: 0 4px 14px var(--success-glow);
    }
    
    .btn-success:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5);
    }
    
    .btn-error {
      background: transparent;
      border: 1px solid var(--error);
      color: var(--error);
    }
    
    .btn-error:hover {
      background: rgba(244, 63, 94, 0.08);
      box-shadow: 0 4px 14px var(--error-glow);
    }
    
    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid currentColor;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: none;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .alert-banner {
      background: rgba(99, 102, 241, 0.1);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 0.85rem;
      color: #a5b4fc;
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .alert-banner svg {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .status-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: var(--bg);
      border-radius: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      text-align: center;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 10;
    }

    .status-overlay.active {
      opacity: 1;
      pointer-events: all;
    }

    .status-icon {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
    }

    .status-success .status-icon {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
    }

    .status-error .status-icon {
      background: rgba(244, 63, 94, 0.1);
      color: var(--error);
    }

    .status-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .status-desc {
      font-size: 0.95rem;
      color: var(--text-muted);
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <div class="checkout-container">
    <div class="brand">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line></svg>
      SimuPay Sandbox
    </div>

    <div class="alert-banner">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <span>This is a secure local simulation sandbox. No real money will be charged.</span>
    </div>

    <div class="booking-summary">
      <div class="event-title">{{EVENT_TITLE}}</div>
      <div class="booking-id">Booking ID: {{BOOKING_ID}}</div>
      <div class="price-row">
        <span class="price-label">Total Amount</span>
        <span class="price-value">$ {{TOTAL_AMOUNT}}</span>
      </div>
    </div>

    <form id="payment-form" onsubmit="event.preventDefault();">
      <div class="form-group">
        <label>Card Number</label>
        <div class="input-wrapper">
          <input type="text" placeholder="4242 4242 4242 4242" value="4242 4242 4242 4242" disabled>
        </div>
      </div>
      <div class="row">
        <div class="form-group">
          <label>Expiration Date</label>
          <input type="text" placeholder="MM/YY" value="12/30" disabled>
        </div>
        <div class="form-group">
          <label>CVC</label>
          <input type="text" placeholder="123" value="123" disabled>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-success" id="btn-success" onclick="processPayment(true)">
          <span class="spinner" id="spinner-success"></span>
          <span id="text-success">Simulate Success</span>
        </button>
        <button type="button" class="btn btn-error" id="btn-fail" onclick="processPayment(false)">
          <span class="spinner" id="spinner-fail"></span>
          <span id="text-fail">Simulate Fail</span>
        </button>
      </div>
    </form>

    <div class="status-overlay" id="status-overlay">
      <div class="status-icon" id="status-icon"></div>
      <div class="status-title" id="status-title"></div>
      <div class="status-desc" id="status-desc"></div>
    </div>
  </div>

  <script>
    const bookingId = "{{BOOKING_ID}}";
    const sessionId = "{{SESSION_ID}}";
    const totalAmount = parseFloat("{{TOTAL_AMOUNT}}");
    const userId = "{{USER_ID}}";

    async function processPayment(success) {
      const btnSuccess = document.getElementById('btn-success');
      const btnFail = document.getElementById('btn-fail');
      const spinnerSuccess = document.getElementById('spinner-success');
      const spinnerFail = document.getElementById('spinner-fail');
      const textSuccess = document.getElementById('text-success');
      const textFail = document.getElementById('text-fail');

      btnSuccess.disabled = true;
      btnFail.disabled = true;

      if (success) {
        spinnerSuccess.style.display = 'block';
        textSuccess.textContent = 'Processing...';
      } else {
        spinnerFail.style.display = 'block';
        textFail.textContent = 'Processing...';
      }

      try {
        if (success) {
          const payload = {
            id: 'evt_mock_' + Math.random().toString(36).substring(2, 11),
            object: "event",
            type: "checkout.session.completed",
            data: {
              object: {
                id: sessionId,
                object: "checkout.session",
                amount_subtotal: Math.round(totalAmount * 100),
                amount_total: Math.round(totalAmount * 100),
                currency: "usd",
                payment_intent: 'pi_mock_' + Math.random().toString(36).substring(2, 11),
                payment_status: "paid",
                status: "complete",
                metadata: {
                  bookingId: bookingId,
                  userId: userId
                }
              }
            }
          };

          const response = await fetch('/payments/webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'stripe-signature': 'mock_signature'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Webhook fulfillment failed');
          }

          showStatus(true, 'Payment Successful', 'Your booking is confirmed! You can close this window now.');
        } else {
          const response = await fetch('/payments/mock-checkout/cancel?bookingId=' + bookingId, {
            method: 'POST'
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.message || 'Cancellation failed');
          }

          showStatus(false, 'Payment Cancelled/Failed', 'The mock checkout session was aborted or failed. Your booking has been cancelled.');
        }
      } catch (err) {
        showStatus(false, 'Transaction Failed', err.message || 'An unexpected error occurred during simulation.');
      }
    }

    function showStatus(isSuccess, title, message) {
      const overlay = document.getElementById('status-overlay');
      const icon = document.getElementById('status-icon');
      const statusTitle = document.getElementById('status-title');
      const statusDesc = document.getElementById('status-desc');

      overlay.className = 'status-overlay active ' + (isSuccess ? 'status-success' : 'status-error');
      
      if (isSuccess) {
        icon.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else {
        icon.innerHTML = '<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      }

      statusTitle.textContent = title;
      statusDesc.textContent = message;
    }
  </script>
</body>
</html>
`;
