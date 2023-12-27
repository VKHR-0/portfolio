const expertise = {
  name: "expertise",
  type: "document",
  title: "Expertise",
  fields: [
    {
      name: "icon",
      type: "image",
      title: "Icon",
    },
    {
      name: "title",
      type: "string",
      title: "Title",
    },
    {
      name: "number",
      type: "number",
      title: "Order Number",
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }],
    },
  ],
};

export default expertise;
