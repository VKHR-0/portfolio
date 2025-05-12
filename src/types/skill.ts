import { TypedObject } from "sanity";

export default interface ISkill {
  _id: string;
  title: string;
  description: TypedObject[];
  order: number;
  badges: IBadge[];
}

export interface IBadge {
  technology: string;
}
