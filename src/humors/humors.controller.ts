import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { HumorsService } from './humors.service';
import { CreateHumorBoardDto } from './dto/create-humor.dto';
import { UpdateHumorDto } from './dto/update-humor.dto';
import {
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Users } from '../users/entities/user.entity';
import { HumorBoards } from './entities/humor-board.entity';
import { UserInfo } from '../utils/decorator/userInfo.decorator';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
@ApiTags('유머 게시판')
@Controller('humors')
export class HumorsController {
  constructor(private readonly humorsService: HumorsService) {}

  @UseInterceptors(FilesInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: '유머 게시판 게시물 생성' })
  @ApiBody({
    description: '유머 게시물 생성',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        files: {
          type: 'array',
          items: {
            format: 'binary',
            type: 'string',
          },
        },
      },
    },
  })
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async createHumorBoard(
    @Body() createHumorBoardDto: CreateHumorBoardDto,
    @UserInfo() user: Users,
    @UploadedFiles() files: Express.Multer.File[],
  ): Promise<HumorBoardReturnValue> {
    const createdBoard = await this.humorsService.createHumorBoard(
      createHumorBoardDto,
      user,
      files,
    );

    return {
      statusCode: HttpStatus.CREATED,
      message: '게시물 생성에 성공하였습니다.',
      data: createdBoard,
    };
  }

  @ApiOperation({ summary: '모든 유머 게시물 조회' })
  @Get()
  async getAllHumorBoards(): Promise<HumorBoardReturnValue> {
    const HumorBoards: HumorBoards[] =
      await this.humorsService.getAllHumorBoards();

    return {
      statusCode: HttpStatus.OK,
      message: '게시물 조회 성공',
      data: HumorBoards,
    };
  }

  @ApiOperation({ summary: '단편 유머 게시물 조회' })
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  async findOneHumorBoard(
    @Param('id') id: number,
  ): Promise<HumorBoardReturnValue> {
    const findHumorBoard: HumorBoards =
      await this.humorsService.findOneHumorBoard(id);
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 조회 성공`,
      data: findHumorBoard,
    };
  }
  @ApiOperation({ summary: '유머 게시물 수정' })
  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  @ApiBody({
    description: '유머 게시물 수정',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
      },
    },
  })
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async updateHumorBoard(
    @Param('id') id: number,
    @Body() updateHumorDto: UpdateHumorDto,
    @UserInfo() user: Users,
  ): Promise<HumorBoardReturnValue> {
    const updatedHumorBoard = await this.humorsService.updateHumorBoard(
      id,
      updateHumorDto,
      user,
    );
    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 업데이트 성공`,
      data: updatedHumorBoard,
    };
  }
  @ApiOperation({ summary: '유머 게시물 삭제' })
  @Delete(':id')
  @ApiParam({
    name: 'id',
    required: true,
    description: '유머 게시물 ID',
    type: Number,
  })
  @UseGuards(AuthGuard('jwt'))
  async removeHumorBoard(
    @Param('id') id: number,
    @UserInfo() user: Users,
  ): Promise<HumorBoardReturnValue> {
    await this.humorsService.deleteHumorBoard(id, user);

    return {
      statusCode: HttpStatus.OK,
      message: `${id}번 게시물 삭제 성공`,
    };
  }
}
