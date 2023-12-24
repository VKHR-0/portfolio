export default interface IProject {
  _id: string;
  title: string;
  description: {
    children: {
      _type: string;
      text: string;
      marks: string[];
    }[];
  }[];
  shortDescription: string;
  thumbnail: {
    asset: { url: string };
  };
  slug: string;
}
