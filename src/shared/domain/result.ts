/**
 * Result monad — explicit success/failure plumbing.
 * Used in use cases and domain methods to avoid throwing for expected errors.
 */
export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  public readonly isFailure: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this.isFailure = !isSuccess;
    this._value = value;
    this._error = error;
    Object.freeze(this);
  }

  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value);
  }

  static fail<T = unknown, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  getValue(): T {
    if (!this.isSuccess) {
      throw new Error('Cannot get value from failed result');
    }
    return this._value as T;
  }

  getError(): E {
    if (!this.isFailure) {
      throw new Error('Cannot get error from successful result');
    }
    return this._error as E;
  }
}
