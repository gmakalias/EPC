import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: {
          include: {
            children: true, // Optional: fetch sub-children
          }
        },
        _count: {
          select: { offerings: true }
        }
      },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: true,
        offerings: true,
      },
    });
    if (!category) throw new NotFoundException(`Category ${id} not found`);
    return category;
  }

  async create(data: any) {
    const id = uuidv4();
    let path = id;
    let level = 0;

    // If there is a parent, calculate the new path and level
    if (data.parentId) {
      const parent = await this.prisma.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new NotFoundException(`Parent category ${data.parentId} not found`);
      }

      path = `${parent.path}/${id}`;
      level = parent.level + 1;
    }

    return this.prisma.category.create({
      data: {
        id, // FIX: Manually providing required UUID
        name: data.name,
        description: data.description,
        isRoot: !data.parentId,
        lifecycleStatus: 'Active',
        path, // FIX: Providing required path
        level, // FIX: Providing required level
        parent: data.parentId 
          ? { connect: { id: data.parentId } } 
          : undefined,
      },
    });
  }

  async remove(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { children: true }
    });

    if (!category) throw new NotFoundException(`Category ${id} not found`);
    
    if (category.children.length > 0) {
      throw new Error('Cannot delete category with sub-categories');
    }

    return this.prisma.category.delete({ where: { id } });
  }
}