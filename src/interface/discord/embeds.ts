import { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { Product } from '@domain/product/product.entity';
import { Order } from '@domain/order/order.aggregate';
import { Payment } from '@domain/payment/payment.aggregate';

export function productEmbed(product: Product): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(product.name)
    .setColor(0x5865f2)
    .setDescription(product.shortDesc ?? product.longDesc ?? 'Sem descrição')
    .addFields(
      { name: 'Preço', value: product.price.format(), inline: true },
      { name: 'Estoque', value: product.unlimited ? '∞' : String(product.stock), inline: true },
      { name: 'Tipo', value: product.type, inline: true },
    );
  if (product.tags.length > 0) {
    embed.addFields({ name: 'Tags', value: product.tags.map((t) => `\`${t}\``).join(' ') });
  }
  if (product.images?.[0]) embed.setImage(product.images[0]);
  return embed;
}

export function productActions(product: Product): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`product_buy:${product.id}`)
      .setLabel('Comprar')
      .setStyle(ButtonStyle.Success)
      .setEmoji('🛒'),
    new ButtonBuilder()
      .setCustomId(`product_wishlist:${product.id}`)
      .setLabel('Wishlist')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('⭐'),
  );
}

export function orderEmbed(order: Order, payment?: Payment): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`Pedido #${order.number}`)
    .setColor(
      order.status === 'PAID' ? 0x57f287 : order.status === 'CANCELLED' ? 0xed4245 : 0xfee75c,
    )
    .addFields(
      { name: 'Status', value: order.status, inline: true },
      { name: 'Total', value: order.total.format(), inline: true },
      { name: 'Itens', value: String(order.items.length), inline: true },
    );
  for (const item of order.items.slice(0, 10)) {
    embed.addFields({
      name: `${item.quantity}x ${item.productName}`,
      value: item.total.format(),
      inline: false,
    });
  }
  if (payment?.pixCode) {
    embed.addFields({ name: 'PIX (Copia e Cola)', value: `\`\`\`${payment.pixCode}\`\`\`` });
  }
  return embed;
}

export function paymentActions(payment: Payment): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`payment_check:${payment.id}`)
      .setLabel('Já paguei')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`payment_simulate:${payment.id}`)
      .setLabel('Simular pagamento (dev)')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🧪'),
  );
}
