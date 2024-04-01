import { Module } from '@nestjs/common';
import { PolticalDebatesService } from './poltical_debates.service';
import { PolticalDebatesController } from './poltical_debates.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PolticalDebateBoards } from 'src/poltical_debates/entities/poltical_debate.entity';
import { PolticalDebateCommentsService } from 'src/poltical_debates/poltical_debate_comments.service';
import { PolticalDebateComments } from 'src/poltical_debates/entities/poltical_debate_comments.entity';
import { PolticalDebateCommentsController } from 'src/poltical_debates/poltical_debate_comments.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([PolticalDebateBoards, PolticalDebateComments]),
  ],
  controllers: [PolticalDebatesController, PolticalDebateCommentsController],
  providers: [PolticalDebatesService, PolticalDebateCommentsService],
})
export class PolticalDebatesModule {}
