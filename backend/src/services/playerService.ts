import { getPrismaClient } from "../utils/prisma";

export interface CreatePlayerData {
  name: string;
}

export interface UpdatePlayerData {
  name: string;
}

export const playerService = {
  async findAll(): Promise<Array<{ id: string; name: string; createdAt: Date; updatedAt: Date }>> {
    return await getPrismaClient().player.findMany({
      orderBy: {
        createdAt: "asc",
      },
    });
  },

  async findById(id: string): Promise<{ id: string; name: string; createdAt: Date; updatedAt: Date } | null> {
    return await getPrismaClient().player.findUnique({
      where: { id },
    });
  },

  async findByName(name: string): Promise<{ id: string; name: string; createdAt: Date; updatedAt: Date } | null> {
    return await getPrismaClient().player.findUnique({
      where: { name },
    });
  },

  async create(data: CreatePlayerData): Promise<{ id: string; name: string; createdAt: Date; updatedAt: Date }> {
    return await getPrismaClient().player.create({
      data,
    });
  },

  async update(id: string, data: UpdatePlayerData): Promise<{ id: string; name: string; createdAt: Date; updatedAt: Date }> {
    return await getPrismaClient().player.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<void> {
    await getPrismaClient().player.delete({
      where: { id },
    });
  },

  async hasHanchans(id: string): Promise<boolean> {
    const count = await getPrismaClient().hanchanPlayer.count({
      where: { playerId: id },
    });
    return count > 0;
  },

  async bulkCreate(data: CreatePlayerData[]): Promise<Array<{ id: string; name: string; createdAt: Date; updatedAt: Date }>> {
    const prisma = getPrismaClient();
    return await prisma.$transaction(
      data.map((item) =>
        prisma.player.create({
          data: item,
        })
      )
    );
  },
};

