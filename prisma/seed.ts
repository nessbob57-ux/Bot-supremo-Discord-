/* eslint-disable @typescript-eslint/no-floating-promises */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo-tenant' },
    create: { name: 'Demo Server', slug: 'demo-tenant', plan: 'PRO' },
    update: {},
  });

  const category = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'cursos' } },
    create: { tenantId: tenant.id, name: 'Cursos', slug: 'cursos' },
    update: {},
  });

  const products = [
    {
      slug: 'curso-discord',
      name: 'Curso Discord Master',
      shortDesc: 'Aprenda Discord do zero ao avançado',
      priceCents: 9990,
      tags: ['curso', 'discord'],
      featured: true,
      unlimited: true,
    },
    {
      slug: 'pack-templates',
      name: 'Pack 50 Templates Premium',
      shortDesc: '50 templates para servidores Discord',
      priceCents: 4990,
      tags: ['templates', 'discord'],
      unlimited: true,
    },
    {
      slug: 'bot-vip',
      name: 'Bot VIP — Acesso Mensal',
      shortDesc: 'Acesso VIP com recursos premium',
      priceCents: 1990,
      isRecurring: true,
      tags: ['vip', 'bot'],
      unlimited: true,
    },
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: p.slug } },
      create: {
        ...p,
        tenantId: tenant.id,
        categoryId: category.id,
        type: p.isRecurring ? 'SUBSCRIPTION' : 'DIGITAL',
      },
      update: {},
    });
  }

  await prisma.plan.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'vip-mensal' } },
    create: {
      tenantId: tenant.id,
      name: 'VIP Mensal',
      slug: 'vip-mensal',
      priceCents: 1990,
      interval: 'MONTHLY',
      benefits: ['Acesso a canais VIP', 'Suporte prioritário', 'Conteúdo exclusivo'],
    },
    update: {},
  });

  await prisma.coupon.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: 'BEMVINDO10' } },
    create: {
      tenantId: tenant.id,
      code: 'BEMVINDO10',
      type: 'PERCENT',
      value: 10,
      description: 'Bem-vindo: 10% de desconto',
    },
    update: {},
  });

  const achievements = [
    { key: 'first_purchase', name: 'Primeira Compra', xpReward: 100 },
    { key: 'big_spender', name: 'Grande Gastador (R$ 100+)', xpReward: 500 },
    { key: 'loyalty_30', name: '30 dias na loja', xpReward: 200 },
    { key: 'affiliate_5', name: '5 indicações pagas', xpReward: 750 },
  ];
  for (const a of achievements) {
    await prisma.achievement.upsert({ where: { key: a.key }, create: a, update: {} });
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
