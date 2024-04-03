import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Users } from '../../users/entities/user.entity';
import { PolticalDebateComments } from './poltical_debate_comments.entity';

@Entity()
export class PolticalDebateBoards {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  userId: number;

  @Column({ type: 'varchar', nullable: false })
  title: string;

  @Column({ type: 'varchar', nullable: false })
  content: string;

  @Column({ type: 'int', nullable: false, default: 0 })
  view: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => Users, (user) => user.polticalDebateBoards)
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: Users;

  @OneToMany(
    () => PolticalDebateComments,
    (polticalDebateComment) => polticalDebateComment.polticalDebateBoard,
    { cascade: true },
  )
  polticalDebateComments: PolticalDebateComments[];
}
