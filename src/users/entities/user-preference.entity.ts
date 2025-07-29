import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export interface UserPreferencesJson {
  global?: {
    email?: boolean;
    sms?: boolean;
    in_app?: boolean;
  };
  notificationTypes?: {
    [eventType: string]: {
      email?: boolean;
      sms?: boolean;
      in_app?: boolean;
    };
  };
}

@Entity('users_preferences')
export class UserPreference {
  @PrimaryColumn({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'jsonb', default: {} })
  preferences: UserPreferencesJson;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;
}
