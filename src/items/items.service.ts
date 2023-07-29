import { CreateItemDto } from './dto/create-item.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { EntityManager, Repository } from 'typeorm';
import { Item } from './entities/item.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Listing } from './entities/listing.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { CreateTagDto } from './dto/create-tag.dto';
import { Tag } from './entities/tag.entity';

@Injectable()
export class ItemsService {
  private readonly logger = new Logger(ItemsService.name);
  constructor(
    @InjectRepository(Item)
    private readonly itemsRepository: Repository<Item>,
    @InjectRepository(Comment)
    private readonly commentsRepository: Repository<Comment>,
    @InjectRepository(Tag)
    private readonly tagsRepository: Repository<Tag>,
    @InjectRepository(Listing)
    private readonly listingRepository: Repository<Listing>,
    private readonly entityManager: EntityManager,
  ) {}

  async create(createItemDto: CreateItemDto) {
    const listing = new Listing({
      ...createItemDto.listing,
      rating: 0,
    });
    const tags = createItemDto.tags.map(
      (createTagDto) => new Tag(createTagDto),
    );
    const item = new Item({ ...createItemDto, comments: [], tags, listing });
    await this.entityManager.save(item);
    return item;
  }

  async findAll() {
    return this.itemsRepository.find({
      relations: { listing: true, comments: true, tags: true },
    });
  }

  async findOne(id: number) {
    return this.itemsRepository.findOne({
      where: { id },
      relations: { listing: true, comments: true, tags: true },
    });
  }

  async update(id: number, updateItemDto: UpdateItemDto) {
    // const item = await this.itemsRepository.findOneBy({ id });
    // item.public = updateItemDto.public;
    // const comments = updateItemDto.comments.map(
    //   (createCommentDto) => new Comment(createCommentDto),
    // );
    // item.comments = comments;
    // await this.entityManager.save(item);
    await this.entityManager.transaction(async (entityManager) => {
      const item = await this.itemsRepository.findOneBy({ id });
      if (item) {
        item.public = updateItemDto.public;
        const comments = updateItemDto.comments.map(
          (createCommentDto) => new Comment(createCommentDto),
        );
        item.comments = comments;
        await entityManager.save(item);
        // throw new Error();
        // const tagContent = `${Math.random()}`;
        // const tag = new Tag({ content: tagContent });
        // await entityManager.save(tag);
      } else {
        this.logger.log('not found in DB');
        throw new NotFoundException();
      }
    });
  }

  async remove(id: number) {
    await this.entityManager.transaction(async (entityManager) => {
      try {
        const item = await this.itemsRepository.findOne({
          where: { id },
          relations: { listing: true, comments: true, tags: true },
        });

        if (item) {
          if (item.comments.length > 0) {
            const comments = item.comments.map((comment) => comment.id);
            await this.commentsRepository.delete(comments);
          }

          if (item.tags.length > 0) {
            const tags = item.tags.map((tag) => tag.id);
            await this.tagsRepository.delete(tags);
          }
          await this.listingRepository.delete(item.listing.id);

          return await entityManager.remove(item);
        }
      } catch (error) {
        this.logger.error(`error in ${error}`);
        throw new NotFoundException();
      }
    });
  }
}
