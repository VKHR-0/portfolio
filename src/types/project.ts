import type { TypedObject } from "sanity";

export default interface IProject {
  _id: string;
  title: string;
  height: number;
  description: TypedObject[];
  thumbnail: {
    asset: { url: string };
  };
}
