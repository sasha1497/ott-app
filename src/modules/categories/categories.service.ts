import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  findAll() {
    return this.categoriesRepository.findAll();
  }

  async findOne(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async create(dto: CreateCategoryDto) {
    try {
      return await this.categoriesRepository.create(dto.name, dto.description);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('A category with this name already exists');
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    return this.categoriesRepository.update(id, dto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.categoriesRepository.delete(id);
    return { message: 'Category deleted successfully' };
  }
}
