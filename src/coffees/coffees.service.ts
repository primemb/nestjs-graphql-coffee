import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm/dist';
import { UserInputError } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import { Repository } from 'typeorm';
import { CreateCoffeeInput } from './dto/create-coffee.input';
import { UpdateCoffeeInput } from './dto/update-coffee.input';
import { Coffee } from './entities/coffee.entity';
import { Flavor } from './entities/flavor.entity';

@Injectable()
export class CoffeesService {
  constructor(
    @InjectRepository(Coffee)
    private readonly coffeesRepository: Repository<Coffee>,
    @InjectRepository(Flavor)
    private readonly falvorRepository: Repository<Flavor>,
    private readonly pubSub: PubSub,
  ) {}

  async findAll() {
    return this.coffeesRepository.find();
  }

  async findOne(id: number) {
    const coffee = await this.coffeesRepository.findOne({ where: { id } });
    if (!coffee) {
      throw new UserInputError(`Coffee #${id} does not exist`);
    }

    return coffee;
  }

  async create(createCoffeeInput: CreateCoffeeInput) {
    const flavors = await Promise.all(
      createCoffeeInput.flavors.map((name) => this.preloadFlavorByName(name)),
    );
    const coffee = this.coffeesRepository.create({
      ...createCoffeeInput,
      flavors,
    });
    const newCoffeeEntity = await this.coffeesRepository.save(coffee);
    this.pubSub.publish('coffeeAdded', { coffeeAdded: newCoffeeEntity });
    return newCoffeeEntity;
  }

  async update(id: number, updateCoffeeInput: UpdateCoffeeInput) {
    const flavors =
      updateCoffeeInput.flavors &&
      (await Promise.all(
        updateCoffeeInput.flavors.map((name) => this.preloadFlavorByName(name)),
      ));

    const coffee = await this.coffeesRepository.preload({
      id,
      ...updateCoffeeInput,
      flavors,
    });
    if (!coffee) {
      throw new UserInputError(`Coffee #${id} does not exist`);
    }
    return this.coffeesRepository.save(coffee);
  }

  async remove(id: number) {
    const coffee = await this.findOne(id);
    return this.coffeesRepository.remove(coffee);
  }

  private async preloadFlavorByName(name: string): Promise<Flavor> {
    const existFlavor = await this.falvorRepository.findOne({
      where: { name },
    });
    if (existFlavor) {
      return existFlavor;
    }
    return this.falvorRepository.create({ name });
  }
}
