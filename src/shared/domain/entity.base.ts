import { randomUUID } from 'crypto';

export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected props: TProps;

  constructor(props: TProps, id?: string) {
    this._id = id ?? randomUUID();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(other?: Entity<TProps>): boolean {
    return !!other && other._id === this._id;
  }
}
