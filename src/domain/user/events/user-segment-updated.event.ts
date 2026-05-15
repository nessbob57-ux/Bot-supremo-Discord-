import { DomainEvent } from '@shared/domain';

export class UserSegmentUpdatedEvent extends DomainEvent {
  constructor(
    userId: string,
    public readonly segment: string,
  ) {
    super(userId);
  }

  get eventName(): string {
    return 'user.segment.updated';
  }
}
