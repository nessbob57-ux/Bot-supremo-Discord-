import { Module } from '@nestjs/common';
import { USER_REPOSITORY } from '@domain/user/user.repository';
import { PRODUCT_REPOSITORY } from '@domain/product/product.repository';
import { CART_REPOSITORY } from '@domain/cart/cart.repository';
import { ORDER_REPOSITORY } from '@domain/order/order.repository';
import { PAYMENT_REPOSITORY } from '@domain/payment/payment.repository';
import { SUBSCRIPTION_REPOSITORY } from '@domain/subscription/subscription.repository';
import { WALLET_REPOSITORY } from '@domain/wallet/wallet.repository';
import { TENANT_REPOSITORY } from '@domain/tenant/tenant.repository';
import { COUPON_REPOSITORY } from '@domain/coupon/coupon.repository';
import { AFFILIATE_REPOSITORY } from '@domain/affiliate/affiliate.repository';

import { UserPrismaRepository } from './user.prisma.repository';
import { ProductPrismaRepository } from './product.prisma.repository';
import { CartPrismaRepository } from './cart.prisma.repository';
import { OrderPrismaRepository } from './order.prisma.repository';
import { PaymentPrismaRepository } from './payment.prisma.repository';
import { SubscriptionPrismaRepository } from './subscription.prisma.repository';
import { WalletPrismaRepository } from './wallet.prisma.repository';
import { TenantPrismaRepository } from './tenant.prisma.repository';
import { CouponPrismaRepository } from './coupon.prisma.repository';
import { AffiliatePrismaRepository } from './affiliate.prisma.repository';

const providers = [
  { provide: USER_REPOSITORY, useClass: UserPrismaRepository },
  { provide: PRODUCT_REPOSITORY, useClass: ProductPrismaRepository },
  { provide: CART_REPOSITORY, useClass: CartPrismaRepository },
  { provide: ORDER_REPOSITORY, useClass: OrderPrismaRepository },
  { provide: PAYMENT_REPOSITORY, useClass: PaymentPrismaRepository },
  { provide: SUBSCRIPTION_REPOSITORY, useClass: SubscriptionPrismaRepository },
  { provide: WALLET_REPOSITORY, useClass: WalletPrismaRepository },
  { provide: TENANT_REPOSITORY, useClass: TenantPrismaRepository },
  { provide: COUPON_REPOSITORY, useClass: CouponPrismaRepository },
  { provide: AFFILIATE_REPOSITORY, useClass: AffiliatePrismaRepository },
];

@Module({
  providers,
  exports: providers,
})
export class PersistenceModule {}
