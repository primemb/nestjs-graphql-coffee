import { Resolver, Query } from '@nestjs/graphql';
import { Coffee } from 'src/coffees/entities/coffee.entity';
import { Drink } from 'src/common/interfaces/drink.interface';
import { DrinksResultUnion } from 'src/common/unions/drinks-result.union';
import { Tea } from 'src/teas/entities/tea.entity';

@Resolver()
export class DrinksResolver {
  @Query(() => [DrinksResultUnion], { name: 'drinks' })
  async findAll(): Promise<(typeof DrinksResultUnion)[]> {
    const coffee = new Coffee();
    coffee.id = 1;
    coffee.name = 'Coffee';
    coffee.brand = 'Coffee Brand';

    const tea = new Tea();
    tea.name = 'Lipton';
    return [coffee, tea];
  }
}
