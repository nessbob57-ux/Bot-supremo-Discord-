import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PersistenceModule } from '@infrastructure/persistence/persistence.module';
import { PaymentsInfraModule } from '@infrastructure/payments/payments.module';

import { EnsureUserUseCase } from './use-cases/user/ensure-user.usecase';
import { CreateProductUseCase } from './use-cases/product/create-product.usecase';
import { SearchProductsUseCase } from './use-cases/product/search-products.usecase';
import { AddToCartUseCase } from './use-cases/cart/add-to-cart.usecase';
import { RemoveFromCartUseCase } from './use-cases/cart/remove-from-cart.usecase';
import { ApplyCouponUseCase } from './use-cases/cart/apply-coupon.usecase';
import { CheckoutUseCase } from './use-cases/checkout/checkout.usecase';
import { ConfirmPaymentUseCase } from './use-cases/payment/confirm-payment.usecase';
import { RefundPaymentUseCase } from './use-cases/payment/refund-payment.usecase';
import { CreateSubscriptionUseCase } from './use-cases/subscription/create-subscription.usecase';
import { CancelSubscriptionUseCase } from './use-cases/subscription/cancel-subscription.usecase';
import { CreditWalletUseCase } from './use-cases/wallet/credit-wallet.usecase';
import { DebitWalletUseCase } from './use-cases/wallet/debit-wallet.usecase';
import { TrackReferralUseCase } from './use-cases/affiliate/track-referral.usecase';
import { FinancialSummaryUseCase } from './use-cases/analytics/financial-summary.usecase';
import { GrantXpUseCase } from './use-cases/gamification/grant-xp.usecase';

import { PaymentApprovedHandler } from './event-handlers/payment-approved.handler';
import { OrderCreatedHandler } from './event-handlers/order-created.handler';
import { CartAbandonedHandler } from './event-handlers/cart-abandoned.handler';

const useCases = [
  EnsureUserUseCase,
  CreateProductUseCase,
  SearchProductsUseCase,
  AddToCartUseCase,
  RemoveFromCartUseCase,
  ApplyCouponUseCase,
  CheckoutUseCase,
  ConfirmPaymentUseCase,
  RefundPaymentUseCase,
  CreateSubscriptionUseCase,
  CancelSubscriptionUseCase,
  CreditWalletUseCase,
  DebitWalletUseCase,
  TrackReferralUseCase,
  FinancialSummaryUseCase,
  GrantXpUseCase,
];

const eventHandlers = [PaymentApprovedHandler, OrderCreatedHandler, CartAbandonedHandler];

@Module({
  imports: [CqrsModule, PersistenceModule, PaymentsInfraModule],
  providers: [...useCases, ...eventHandlers],
  exports: [...useCases],
})
export class ApplicationModule {}
