import { Product } from '../product/product.entity';
import { Money } from '../../shared/domain/money';

describe('Product', () => {
  const make = (overrides: Partial<Parameters<typeof Product.create>[0]> = {}) =>
    Product.create({
      tenantId: 't1',
      name: 'Test',
      slug: 'test',
      price: Money.create(1000),
      stock: 5,
      ...overrides,
    });

  it('canBeSold when stock available', () => {
    expect(make().canBeSold(3)).toBe(true);
    expect(make().canBeSold(99)).toBe(false);
  });

  it('canBeSold always true when unlimited', () => {
    expect(make({ unlimited: true, stock: 0 }).canBeSold(1000)).toBe(true);
  });

  it('reserveStock decreases stock', () => {
    const p = make({ stock: 10 });
    p.reserveStock(3);
    expect(p.stock).toBe(7);
  });

  it('reserveStock throws on overdraft', () => {
    expect(() => make({ stock: 1 }).reserveStock(5)).toThrow();
  });

  it('restoreStock increases stock', () => {
    const p = make({ stock: 1 });
    p.restoreStock(4);
    expect(p.stock).toBe(5);
  });

  it('hidden products cannot be sold', () => {
    const p = make();
    p.hide();
    expect(p.canBeSold()).toBe(false);
  });
});
