import { Module } from '@nestjs/common';
import { ApplicationModule } from '@application/application.module';
import { DiscordService } from './discord.service';
import { CommandRegistry } from './command-registry';
import { TenantResolverService } from './tenant-resolver.service';
import { LojaCommand } from './commands/loja.command';
import { CarrinhoCommand } from './commands/carrinho.command';
import { CheckoutCommand } from './commands/checkout.command';
import { PerfilCommand } from './commands/perfil.command';
import { AdminProductCommand } from './commands/admin-product.command';
import { FinanceiroCommand } from './commands/financeiro.command';
import { ProductButtonsHandler } from './components/product-buttons.handler';
import { PaymentButtonsHandler } from './components/payment-buttons.handler';

@Module({
  imports: [ApplicationModule],
  providers: [
    DiscordService,
    CommandRegistry,
    TenantResolverService,
    LojaCommand,
    CarrinhoCommand,
    CheckoutCommand,
    PerfilCommand,
    AdminProductCommand,
    FinanceiroCommand,
    ProductButtonsHandler,
    PaymentButtonsHandler,
  ],
  exports: [DiscordService],
})
export class DiscordModule {}
