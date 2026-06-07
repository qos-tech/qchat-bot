export type Button = {
  type: "reply";
  displayText: string;
  id: string;
};

export type ButtonMessage = {
  title: string;
  description: string;
  buttons: Button[];
};
