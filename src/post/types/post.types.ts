interface EntityBase {
  type: string;
  from: number;
  to: number;
}

export interface MentionEntity extends EntityBase {
  type: 'mention';
  username: string;
}

export interface LinkEntity extends EntityBase {
  type: 'link';
  url: string;
}

export type TextEntity = MentionEntity | LinkEntity;
