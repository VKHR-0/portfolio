import { TypedObject } from "sanity";

export default interface IProject {
  _id: string;
  title: string;
  description: TypedObject[];
  shortDescription: string;
  thumbnail: {
    asset: { url: string };
  };
  slug: string;
}
