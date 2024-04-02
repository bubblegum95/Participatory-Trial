import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Users } from '../users/entities/user.entity';
import { CreatePolticalDebateDto } from './dto/create-poltical_debate.dto';
import { UpdatePolticalDebateDto } from './dto/update-poltical_debate.dto';
import { PolticalDebateBoards } from './entities/poltical_debate.entity';
import { UserInfos } from '../users/entities/user-info.entity';
import { VoteDto } from 'src/trials/vote/dto/voteDto';
import { PolticalDebateVotes } from './entities/polticalVote.entity';
import { UpdateVoteDto } from 'src/trials/vote/dto/updateDto';

@Injectable()
export class PolticalDebatesService {
  constructor(
    @InjectRepository(PolticalDebateBoards)
    private readonly polticalDebateRepository: Repository<PolticalDebateBoards>,
    private readonly dataSource: DataSource
  ) {}
  async create(
    userInfo: UserInfos,
    createPolticalDebateDto: CreatePolticalDebateDto,
  ) {
    const { title, content } = createPolticalDebateDto;

    const defaultViewCount = 1;

    const createdPolticalDebate = this.polticalDebateRepository.create({
      title,
      content,
      view: defaultViewCount,
      userId: userInfo.id,
    });

    return this.polticalDebateRepository.save(createdPolticalDebate);
  }

  async findAll() {
    const findAllPolticalDebateBoard = await this.polticalDebateRepository.find(
      {
        order: { id: 'ASC' },
      },
    );

    return findAllPolticalDebateBoard;
  }

  async findMyBoards(userId: number) {
    return this.polticalDebateRepository.find({
      where: { userId },
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const findOnePolticalDebateBoard =
      await this.polticalDebateRepository.findOne({
        where: { id },
      });

    if (!findOnePolticalDebateBoard) {
      throw new BadRequestException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    return findOnePolticalDebateBoard;
  }

  async update(
    userInfo: UserInfos,
    id: number,
    updatePolticalDebateDto: UpdatePolticalDebateDto,
  ) {
    const userId = userInfo.id;

    const polticalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!polticalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (polticalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게시판을 수정할 권한이 없습니다.');
    }

    const existingViewCount = polticalDebateBoard.view;

    polticalDebateBoard.userId = userId;
    polticalDebateBoard.title = updatePolticalDebateDto.title;
    polticalDebateBoard.content = updatePolticalDebateDto.content;
    polticalDebateBoard.view = existingViewCount;

    const updatedBoard =
      await this.polticalDebateRepository.save(polticalDebateBoard);
    return updatedBoard;
  }

  async delete(userInfo: UserInfos, id: number) {
    console.log(userInfo);
    const userId = userInfo.id;

    const politicalDebateBoard = await this.polticalDebateRepository.findOne({
      where: { id },
    });

    if (!politicalDebateBoard) {
      throw new NotFoundException('정치 토론 게시판을 찾을 수 없습니다.');
    }

    if (politicalDebateBoard.userId !== userId) {
      throw new UnauthorizedException('게시판를 삭제할 권한이 없습니다.');
    }

    const deleteBoard =
      await this.polticalDebateRepository.remove(politicalDebateBoard);

    return deleteBoard;
  }

  // 정치 게시만 투표 vs 만들기 매서드
  async createSubject(polticalId: number, voteDto: VoteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 객체 분해 할당 시킴 Dto
      const { title1, title2 } = voteDto;

      // 2. 객체에 담음(담는 이유 한번에 저장하면 빠름)
      const vote = {
        title1,
        title2,
        polticalId,
      };

      // 3. 객체 만든거 생성
      const voteSubject = queryRunner.manager.create(PolticalDebateVotes, vote);

      // 4. 만든 객체 저장
      await queryRunner.manager.save(PolticalDebateVotes, voteSubject);

      // 5. 트랜 잭션 종료
      await queryRunner.commitTransaction();

      // 6. 잘 생성되면 vote 리턴
      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 생성 오류:', error);

      throw new InternalServerErrorException('vs 생성 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 정치 게시만 투표 vs 수정 매서드
  async updateSubject(polticalVoteId: number, updateVoteDto: UpdateVoteDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 수정할 투표 찾기
      const vote = await queryRunner.manager.findOne(PolticalDebateVotes, {
        where: {
          id: polticalVoteId,
        },
      });

      // 2. 찾은 객체 업데이트(이렇게 하면 DB 한번만 들어가면됨)
      Object.assign(vote, updateVoteDto);

      // 3. 객체 저장
      await queryRunner.manager.save(PolticalDebateVotes, vote);

      // 4. 트랜 잭션 종료

      await queryRunner.commitTransaction();

      return vote;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 수정 오류:', error);

      throw new InternalServerErrorException('vs 수정 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }

  // 정치 게시만 투표 vs 삭제 매서드
  async deleteVote(polticalVoteId: number) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // 1. 재판 삭제(일반적으로 remove보다 delete가 더 빠르다.)
      const deleteResult = await queryRunner.manager.delete(PolticalDebateVotes, {
        id: polticalVoteId,
      });

      // 2. 없으면 404
      if (deleteResult.affected === 0) {
        throw new NotFoundException(
          '찾는 정치 게시판 투표가 없습니다. 또는 이미 삭제되었습니다.',
        );
      }
      // 3. 트랜 잭션 종료
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();

      console.log('vs 삭제 오류:', error);

      throw new InternalServerErrorException('vs 삭제 중 오류가 발생했습니다.');
    } finally {
      await queryRunner.release();
    }
  }
}
