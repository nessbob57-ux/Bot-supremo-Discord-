import { AggregateRoot } from '@shared/domain';
import { Money } from '@shared/domain';
import { BusinessRuleError, ValidationError } from '@shared/errors/domain.errors';

export type ProductType = 'DIGITAL' | 'PHYSICAL' | 'SERVICE' | 'SUBSCRIPTION';
export type DeliveryMode = 'AUTOMATIC' | 'MANUAL' | 'SCHEDULED';

export interface ProductProps {
  tenantId: string;
  categoryId?: string;
  name: string;
  slug: string;
  sku?: string;
  shortDesc?: string;
  longDesc?: string;
  type: ProductType;
  price: Money;
  compareAt?: Money;
  stock: number;
  unlimited: boolean;
  minPerUser: number;
  maxPerUser?: number;
  hidden: boolean;
  exclusive: boolean;
  featured: boolean;
  isFree: boolean;
  isRecurring: boolean;
  isBundle: boolean;
  isSecret: boolean;
  isPreorder: boolean;
  releaseAt?: Date;
  expiresAt?: Date;
  deliveryMode: DeliveryMode;
  images: string[];
  tags: string[];
  metadata: Record<string, unknown>;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Product extends AggregateRoot<ProductProps> {
  static create(
    props: Partial<ProductProps> & Pick<ProductProps, 'tenantId' | 'name' | 'slug' | 'price'>,
    id?: string,
  ): Product {
    if (!props.name?.trim()) throw new ValidationError('Product.name is required');
    if (props.price.isNegative()) throw new ValidationError('Product.price cannot be negative');

    return new Product(
      {
        tenantId: props.tenantId,
        categoryId: props.categoryId,
        name: props.name,
        slug: props.slug,
        sku: props.sku,
        shortDesc: props.shortDesc,
        longDesc: props.longDesc,
        type: props.type ?? 'DIGITAL',
        price: props.price,
        compareAt: props.compareAt,
        stock: props.stock ?? 0,
        unlimited: props.unlimited ?? false,
        minPerUser: props.minPerUser ?? 1,
        maxPerUser: props.maxPerUser,
        hidden: props.hidden ?? false,
        exclusive: props.exclusive ?? false,
        featured: props.featured ?? false,
        isFree: props.isFree ?? false,
        isRecurring: props.isRecurring ?? false,
        isBundle: props.isBundle ?? false,
        isSecret: props.isSecret ?? false,
        isPreorder: props.isPreorder ?? false,
        releaseAt: props.releaseAt,
        expiresAt: props.expiresAt,
        deliveryMode: props.deliveryMode ?? 'AUTOMATIC',
        images: props.images ?? [],
        tags: props.tags ?? [],
        metadata: props.metadata ?? {},
        active: props.active ?? true,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }

  get tenantId() {
    return this.props.tenantId;
  }
  get name() {
    return this.props.name;
  }
  get slug() {
    return this.props.slug;
  }
  get price() {
    return this.props.price;
  }
  get stock() {
    return this.props.stock;
  }
  get unlimited() {
    return this.props.unlimited;
  }
  get hidden() {
    return this.props.hidden;
  }
  get active() {
    return this.props.active;
  }
  get featured() {
    return this.props.featured;
  }
  get type() {
    return this.props.type;
  }
  get isFree() {
    return this.props.isFree;
  }
  get isRecurring() {
    return this.props.isRecurring;
  }
  get isPreorder() {
    return this.props.isPreorder;
  }
  get deliveryMode() {
    return this.props.deliveryMode;
  }
  get tags() {
    return this.props.tags;
  }
  get categoryId() {
    return this.props.categoryId;
  }
  get shortDesc() {
    return this.props.shortDesc;
  }
  get longDesc() {
    return this.props.longDesc;
  }
  get images() {
    return this.props.images;
  }
  get exclusive() {
    return this.props.exclusive;
  }
  get isSecret() {
    return this.props.isSecret;
  }
  get isBundle() {
    return this.props.isBundle;
  }
  get minPerUser() {
    return this.props.minPerUser;
  }
  get maxPerUser() {
    return this.props.maxPerUser;
  }
  get compareAt() {
    return this.props.compareAt;
  }

  canBeSold(qty = 1): boolean {
    if (!this.props.active || this.props.hidden) return false;
    if (this.props.expiresAt && this.props.expiresAt < new Date()) return false;
    if (this.props.isPreorder && this.props.releaseAt && this.props.releaseAt > new Date())
      return false;
    if (this.props.unlimited) return true;
    return this.props.stock >= qty;
  }

  reserveStock(quantity: number): void {
    if (this.props.unlimited) return;
    if (this.props.stock < quantity) {
      throw new BusinessRuleError(`Insufficient stock for product ${this.props.name}`);
    }
    this.props.stock -= quantity;
    this.props.updatedAt = new Date();
  }

  restoreStock(quantity: number): void {
    if (this.props.unlimited) return;
    this.props.stock += quantity;
    this.props.updatedAt = new Date();
  }

  setStock(stock: number): void {
    if (stock < 0) throw new ValidationError('Stock cannot be negative');
    this.props.stock = stock;
    this.props.updatedAt = new Date();
  }

  updatePrice(price: Money): void {
    if (price.isNegative()) throw new ValidationError('Price cannot be negative');
    this.props.price = price;
    this.props.updatedAt = new Date();
  }

  feature(): void {
    this.props.featured = true;
  }
  unfeature(): void {
    this.props.featured = false;
  }
  hide(): void {
    this.props.hidden = true;
  }
  show(): void {
    this.props.hidden = false;
  }
  deactivate(): void {
    this.props.active = false;
  }
  activate(): void {
    this.props.active = true;
  }

  toJSON() {
    return {
      id: this.id,
      ...this.props,
      priceCents: this.props.price.amountCents,
      currency: this.props.price.currency,
    };
  }
}
