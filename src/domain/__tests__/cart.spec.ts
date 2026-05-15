import { Cart } from '../cart/cart.aggregate';
import { Money } from '../../shared/domain/money';

describe('Cart', () => {
  it('starts empty', () => {
    const cart = Cart.create({ userId: 'u1' });
    expect(cart.isEmpty).toBe(true);
    expect(cart.subtotal().amountCents).toBe(0);
  });

  it('adds and removes items', () => {
    const cart = Cart.create({ userId: 'u1' });
    cart.addItem('p1', 2, Money.create(1500));
    expect(cart.items).toHaveLength(1);
    expect(cart.subtotal().amountCents).toBe(3000);
    cart.removeItem('p1');
    expect(cart.isEmpty).toBe(true);
  });

  it('merges quantities for repeated product', () => {
    const cart = Cart.create({ userId: 'u1' });
    cart.addItem('p1', 1, Money.create(1000));
    cart.addItem('p1', 2, Money.create(1000));
    expect(cart.items[0].quantity).toBe(3);
  });

  it('emits CartAbandonedEvent when marked abandoned', () => {
    const cart = Cart.create({ userId: 'u1' });
    cart.addItem('p1', 1, Money.create(1000));
    cart.markAbandoned();
    expect(cart.status).toBe('ABANDONED');
    expect(cart.domainEvents).toHaveLength(1);
    expect(cart.domainEvents[0].eventName).toBe('cart.abandoned');
  });

  it('cannot checkout when empty', () => {
    const cart = Cart.create({ userId: 'u1' });
    expect(() => cart.checkout()).toThrow();
  });
});
