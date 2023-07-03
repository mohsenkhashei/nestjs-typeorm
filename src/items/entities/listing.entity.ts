import { AbstractEntity } from '../../database/abstract.entity';
import { Column, Entity, OneToOne } from 'typeorm';
import { Item } from './item.entity';

@Entity()
export class Listing extends AbstractEntity<Listing> {
  // @PrimaryGeneratedColumn()
  // id: number;
  @Column()
  description: string;

  @Column()
  rating: number;

  @OneToOne(() => Item, { onDelete: 'CASCADE' })
  item: Item;

  // constructor(listing: Partial<Listing>) {
  //   Object.assign(this, listing);
  // }
}
