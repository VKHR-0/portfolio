import { TypedObject } from "sanity";

export default interface IProject {
  _id: string;
  title: string;
  link: string;
  height: number;
  description: TypedObject[];
  shortDescription: string;
  thumbnail: {
    asset: { url: string };
  };
}
