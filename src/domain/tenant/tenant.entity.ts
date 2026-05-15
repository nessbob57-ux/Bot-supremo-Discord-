import { Entity } from '@shared/domain';

export type TenantPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

export interface TenantProps {
  discordGuildId?: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  isActive: boolean;
  whiteLabel: boolean;
  subdomain?: string;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class Tenant extends Entity<TenantProps> {
  static create(
    props: Partial<TenantProps> & Pick<TenantProps, 'name' | 'slug'>,
    id?: string,
  ): Tenant {
    return new Tenant(
      {
        name: props.name,
        slug: props.slug,
        discordGuildId: props.discordGuildId,
        plan: props.plan ?? 'FREE',
        isActive: props.isActive ?? true,
        whiteLabel: props.whiteLabel ?? false,
        subdomain: props.subdomain,
        settings: props.settings ?? {},
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
  }
  get plan() {
    return this.props.plan;
  }
  get isActive() {
    return this.props.isActive;
  }
  get discordGuildId() {
    return this.props.discordGuildId;
  }
  get whiteLabel() {
    return this.props.whiteLabel;
  }
  get settings() {
    return this.props.settings;
  }

  upgrade(plan: TenantPlan): void {
    this.props.plan = plan;
    this.props.updatedAt = new Date();
  }

  enableWhiteLabel(): void {
    this.props.whiteLabel = true;
    this.props.updatedAt = new Date();
  }

  updateSettings(patch: Record<string, unknown>): void {
    this.props.settings = { ...this.props.settings, ...patch };
    this.props.updatedAt = new Date();
  }

  isFeatureEnabled(feature: string): boolean {
    const planFeatures: Record<TenantPlan, string[]> = {
      FREE: ['basic_commerce', 'basic_payments'],
      STARTER: ['basic_commerce', 'basic_payments', 'coupons', 'analytics_basic'],
      PRO: [
        'basic_commerce',
        'basic_payments',
        'coupons',
        'analytics_basic',
        'subscriptions',
        'affiliates',
        'campaigns',
      ],
      ENTERPRISE: [
        'basic_commerce',
        'basic_payments',
        'coupons',
        'analytics_basic',
        'subscriptions',
        'affiliates',
        'campaigns',
        'white_label',
        'priority_support',
        'webhooks',
      ],
    };
    return planFeatures[this.props.plan]?.includes(feature) ?? false;
  }
}
