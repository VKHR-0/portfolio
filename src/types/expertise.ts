import type { TypedObject } from "sanity";

export default interface IExpertise {
  _id: string;
  title: string;
  number: number;
  description: TypedObject[];
  icon: {
    asset: { url: string };
  };
}
